from django.shortcuts import render
from django.http import HttpResponse, HttpResponseRedirect
from django.template import loader
from expences.models import Expuser, Expence, Location, Currency,Category
from expences.serializers import UserSettingsSerializer, ExpenceSerializer, ExpenceShortSerializer, ExpenceDateSerializer, ExpenceCatDateSerializer 
from django.dispatch import receiver
from django.db.models.signals import post_save
from django.db.models import Sum, FloatField, Count
from django.contrib.auth.models import User
import json
from datetime import datetime, timedelta
from rest_framework import serializers

# Create your views here.

def index(request):
    if request.session.get('_auth_user_id'):
        template = loader.get_template('exp/expences.html')
    else:
        return HttpResponseRedirect('login')
    return HttpResponse(template.render(None,request))

#used for expences and settings pages
def init(request):
    id=request.session.get('_auth_user_id')
    if not id:
        return HttpResponse(json.dumps({'error':'no user id found'}),content_type="application/json")
    settings= UserSettingsSerializer(Expuser.objects.filter(id=id).first())
    fields=list(map(lambda f : f, ExpenceSerializer().fields))
    quick_cats=list(map(lambda c: c['category'], Expence.objects.filter(user_id=id).values('category').annotate(cat_count=Count('category')).order_by('-cat_count').values('category')[:6]))
    response={'settings':settings.data, 'lists':[{'name':'currency','values':list(Currency.objects.all().values_list('name',flat=True))}, {'name':'location', 'values':list(Location.objects.all().values_list('name',flat=True))},{'name':'category', 'values':list(Category.objects.all().values_list('name',flat=True))}], 'fields':fields, 'quick_cats':quick_cats}
    return HttpResponse(json.dumps(response),content_type="application/json")

def save(request):
    try:
        user_id=request.session.get('_auth_user_id')
        body = json.loads(request.body.decode('utf-8'))
        id=body.pop('id',None)
        #print ('id is'+id)
        args=body.copy()
        args['currency']=Currency.objects.get(name=body['currency'])
        args['location']=Location.objects.get(name=body['location'])
        args['category']=Category.objects.get(name=body['category'])
        args['user_id']=Expuser.objects.get(id=request.session.get('_auth_user_id'))
        args['logtime']=datetime.now()
        if not id:
            exp=Expence(**args)
            exp.save()
            id=exp.id
            print (id)
        else:
            updated=Expence.objects.filter(id=id).update(**args)
            if updated!=1:
                return HttpResponse(json.dumps({'error':'updating error'}))
        return HttpResponse(json.dumps({'saved':ExpenceSerializer(Expence.objects.filter(id=id),many=True).data}))
    except:
        return HttpResponse(json.dumps({'error':'internal error'}))

def delete(request):
    try:
        user_id=request.session.get('_auth_user_id')
        body = json.loads(request.body.decode('utf-8'))
        if body['id']:
            exp=Expence.objects.get(id=body['id'], user_id=user_id)
            exp.delete()
            return HttpResponse(json.dumps({'deleted':body['id']}))
        else:
            return HttpResponse(json.dumps({'error':'id not specified'}))
    except:
        return HttpResponse(json.dumps({'error':'internal error'}))
   
def table(request):
    starttime=request.GET.get('from',datetime.now()-timedelta(30))
    endtime=request.GET.get('to',datetime.now())
    shorter=request.GET.get('short',False)
    category=request.GET.get('category',None)
    try:
        user_id=request.session.get('_auth_user_id')
        objects=Expence.objects.filter(exptime__gte = starttime,exptime__lte=endtime, user_id=user_id)
        if category:
            print ('using cat')
            objects=objects.filter(category=category)
        if shorter:
            print ('using short')
            response=ExpenceShortSerializer(objects,many=True).data
            print (response)
        else:
            response=ExpenceSerializer(objects,many=True).data
        return HttpResponse(json.dumps(response),content_type="application/json")
    except:
       return HttpResponse(json.dumps({'error':'internal error'}))

def aggr(request):
    starttime=request.GET.get('from',datetime.now()-timedelta(30))
    endtime=request.GET.get('to',datetime.now())
    aggtype=request.GET.get('agg','catdate')
    try:
        user_id=request.session.get('_auth_user_id')
        response=None
        qs=Expence.objects.filter(exptime__gte = starttime,exptime__lte=endtime, user_id=user_id).order_by('exptime')
        if aggtype=='catdate':
            response=ExpenceCatDateSerializer( qs.filter(is_expence=True).values('exptime','category','currency').annotate(summ=Sum('summ', output_field=FloatField())),many=True).data
        if aggtype=='date':
            response=ExpenceDateSerializer( qs.filter(is_expence=True).values('exptime','currency').annotate(summ=Sum('summ', output_field=FloatField())),many=True).data
        if aggtype=='incomedate':
            response=ExpenceCatDateSerializer( qs.filter(is_expence=False).values('exptime','category','currency').annotate(summ=Sum('summ', output_field=FloatField())),many=True).data
        return HttpResponse(json.dumps(response),content_type="application/json")
    except:
       return HttpResponse(json.dumps({'error':'internal error'}))

@receiver(post_save, sender=User)
def add_Expuser(sender, instance, created,**kwargs):
    if created:
        parent_link_field = Expuser._meta.parents.get(User.__class__, None)
        print(parent_link_field)
        new_attrs={}
        new_attrs['user_ptr'] = instance
        for field in instance._meta.fields:
            new_attrs[field.name] = getattr(instance, field.name)
        e=Expuser(**new_attrs)
        e.category,cr=Category.objects.get_or_create(name='other')
        e.currency,cr=Currency.objects.get_or_create(name='---')
        e.location,cr=Location.objects.get_or_create(name='default')
        e.save()



