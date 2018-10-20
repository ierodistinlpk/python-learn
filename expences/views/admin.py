from django.shortcuts import render
from django.http import HttpResponse, HttpResponseRedirect
from django.template import loader
from expences.models import Location, Currency, Category
from django.contrib.auth.models import User
#from rest_framework import serializers
import sys, json
#from datetime import datetime, timedelta
# Create your views here.

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
