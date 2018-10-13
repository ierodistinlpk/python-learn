from django.shortcuts import render
from django.http import HttpResponse, HttpResponseRedirect
from django.template import loader
from expences.models import Expuser, Expence, Location, Currency,Category
from django.dispatch import receiver
from django.db.models.signals import post_save
from django.contrib.auth.models import User
from rest_framework import serializers
import sys, json
from datetime import datetime, timedelta
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
    response={'settings':settings.data, 'lists':[{'name':'currency','values':list(Currency.objects.all().values_list('name',flat=True))}, {'name':'location', 'values':list(Location.objects.all().values_list('name',flat=True))},{'name':'category', 'values':list(Category.objects.all().values_list('name',flat=True))}], 'fields':fields }
    return HttpResponse(json.dumps(response),content_type="application/json")

def save(request):
#    try:
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
#    except:
#        return HttpResponse(json.dumps({'error':'internal error'}))
def delete(request):
    try:
        body = json.loads(request.body.decode('utf-8'))
        if body['id']:
            exp=Expence.objects.get(id=body['id'])
            exp.delete()
            return HttpResponse(json.dumps({'deleted':body['id']}))
        else:
            return HttpResponse(json.dumps({'error':'id not specified'}))
    except:
        return HttpResponse(json.dumps({'error':'internal error'}))
   
def table(request):
    #from=2018-08-08&to=2019-01-01
    starttime=request.GET.get('from',datetime.now()-timedelta(30))
    endtime=request.GET.get('to',datetime.now())
    try:
        response=ExpenceSerializer(Expence.objects.filter(exptime__gte = starttime,exptime__lte=endtime),many=True).data
        #if 'aggr_date' in request.GET:
        #     response=ExpenceSerializer(Expence.objects.filter(exptime__gte = starttime,exptime__lte=endtime).groupby,many=True).data
       
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

def admin(request):
    if request.session.get('_auth_user_id'): #and user is admin:
        template = loader.get_template('exp/admin.html')
        return HttpResponse(template.render(None,request))
    else:
        return HttpResponseRedirect('login')

def admindata(request):
    id=request.session.get('_auth_user_id')
    if not id:
        return HttpResponse(json.dumps({error:'no user id found'}),content_type="application/json")
    response={'lists':[{'name':'currency','values':list(Currency.objects.all().values_list('name',flat=True))}, {'name':'location', 'values':list(Location.objects.all().values_list('name',flat=True))},{'name':'category', 'values':list(Category.objects.all().values_list('name',flat=True))}] }
    return HttpResponse(json.dumps(response),content_type="application/json")

def admindelete(request):
    id=request.session.get('_auth_user_id')
    if not id:
        return HttpResponse(json.dumps({error:'no user id found'}),content_type="application/json")
    try:
        body = json.loads(request.body.decode('utf-8'))
        key = list(body.keys())[0]
        orm={'currency':Currency,'category':Category, 'location':Location}
        c=orm[key].objects.get(name=body[key])
        c.delete()
        return HttpResponse(json.dumps({'deleted':{key:body[key]}}))
    except:
        return HttpResponse(json.dumps({'error':'internal error'}))

def adminsave(request):
    id=request.session.get('_auth_user_id')
    if not id:
        return HttpResponse(json.dumps({error:'no user id found'}),content_type="application/json")
    try:
        body = json.loads(request.body.decode('utf-8'))
        key = list(body.keys())[0]
        orm={'currency':Currency,'category':Category, 'location':Location}
        c=orm[key](name=body[key])
        c.save()
        return HttpResponse(json.dumps({'saved':{key:body[key]}}))
    except:
        return HttpResponse(json.dumps({'error':'internal error'}))

# settings page
# init request is used for data
def settings(request):
    if request.session.get('_auth_user_id'):
        template = loader.get_template('exp/settings.html')
        return HttpResponse(template.render(None,request))
    else:
        return HttpResponseRedirect('login')

def savesettings(request):
#    try:
        body = json.loads(request.body.decode('utf-8'))
        id=body.pop('id',None)
        user=Expuser.objects.get(id=request.session.get('_auth_user_id'))
        user.category,cr=Category.objects.get_or_create(name=body['category'])
        user.currency,cr=Currency.objects.get_or_create(name=body['currency'])
        user.location,cr=Location.objects.get_or_create(name=body['location'])
        user.save()
        return HttpResponse(json.dumps({'saved':UserSettingsSerializer(user).data}))
#    except:
#        return HttpResponse(json.dumps({'error':'internal error'}))
    
class UserSettingsSerializer(serializers.ModelSerializer):
    #currency=serializers.SlugRelatedField(many=True, read_only=True,slug_field='name')
    class Meta:
        model = Expuser
        fields = ('currency','location','category')

class ExpenceSerializer(serializers.ModelSerializer):
    #currency=serializers.SlugRelatedField(many=True, read_only=True,slug_field='name')
    class Meta:
        model = Expence
        exclude = ('logtime','user_id')

