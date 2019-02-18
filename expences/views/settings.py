from django.shortcuts import render
from django.http import HttpResponse, HttpResponseRedirect
from django.template import loader
from expences.models import Expuser, Location, Currency,Category
from django.contrib.auth.models import User
import sys, json
   

# settings page
# init request is used for data
def settings(request):
    if request.session.get('_auth_user_id'):
        template = loader.get_template('exp/settings.html')
        return HttpResponse(template.render(None,request))
    else:
        return HttpResponseRedirect('login')

def savesettings(request):
    try:
        body = json.loads(request.body.decode('utf-8'))
        id=body.pop('id',None)
        user=Expuser.objects.get(id=request.session.get('_auth_user_id'))
        user.category,cr=Category.objects.get_or_create(name=body['category'])
        user.currency,cr=Currency.objects.get_or_create(name=body['currency'])
        user.location,cr=Location.objects.get_or_create(name=body['location'])
        user.save()
        return HttpResponse(json.dumps({'saved':UserSettingsSerializer(user).data}))
    except:
        return HttpResponse(json.dumps({'error':'internal error'}))
