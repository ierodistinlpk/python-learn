from django.http import JsonResponse, HttpResponse
from django.template import loader
from expences.models import Expuser, Expence, Location, Currency,Category
from expences.serializers import UserSettingsSerializer, ExpenceSerializer, ExpenceShortSerializer, ExpenceDateSerializer, ExpenceCatDateSerializer, ExpenceGaugeSerializer
from django.dispatch import receiver
from django.db.models.signals import post_save
from django.db.models import Sum, FloatField, Count
from django.contrib.auth.models import User
import json, logging,sys
from datetime import datetime, timedelta
from django.db.models.functions import TruncMonth

#log_level=logging.DEBUG
#log_level=logging.INFO
log_level=logging.WARNING
logging.basicConfig(level=log_level, handlers=[logging.StreamHandler(sys.stdout)])

def expences(request):
    user_id=authenticated_user(request)
    if user_id:
        #get list matched
        if request.method=='GET': 
            starttime=request.GET.get('from',datetime.now()-timedelta(30))
            endtime=request.GET.get('to',datetime.now())
            shorter=request.GET.get('short',False)
            category=request.GET.get('category',None)
            try:
                objects=Expence.objects.filter(exptime__gte = starttime,exptime__lte=endtime, user_id=user_id).order_by('exptime')
                if category:
                    #logger.debug('using cat %s', category)
                    objects=objects.filter(category=category)
                if shorter:
                    print ('using short')
                    response=ExpenceShortSerializer(objects,many=True).data
                    print (response)
                else:
                    response=ExpenceSerializer(objects,many=True).data
                return JsonResponse(response,status=200,safe=False)
            except Exception as e:
                logging.error(e)
                return JsonResponse({'error':'internal error'},status=500)
        #create/update object
        elif request.method=='POST': 
            body = json.loads(request.body.decode('utf-8'))
            id=body.pop('id',None)
            args=body.copy()
            args['currency']=Currency.objects.get(name=body['currency'])
            args['location']=Location.objects.get(name=body['location'])
            args['category']=Category.objects.get(name=body['category'])
            args['user_id']=Expuser.objects.get(id=request.session.get('_auth_user_id'))
            args['logtime']=datetime.now()
            if not id:
                exp=Expence(**args)
                try:
                    exp.save()
                    id=exp.id
                    print (id)
                except:
                    return Response(json.dumps({'error':'updating error'}), status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            else: 
                updated=Expence.objects.filter(id=id).update(**args)
                if updated!=1:
                    return JsonResponse({'error':'updating error'}, status=500)
            return Response(json.dumps({ExpenceSerializer(Expence.objects.filter(id=id),many=True).data}), status=status.HTTP_200_OK)
        #delete object
        elif request.method=='DELETE': 
            body = json.loads(request.body.decode('utf-8'))
            if body['id']:
                exp=Expence.objects.get(id=body['id'], user_id=user_id)
                exp.delete()
                return JsonResponse({deleted:body['id']},status=200)
            else:
                return JsonResponse({'error':'id not specified'},status=404)
        #any bad requests
        else:
            return JsonResponse({error:'request not supported'}, status=405)
    else:
        return JsonResponse({'error':'auth required'}, status=401)

## for categories,currencies and locations
def listed(request,key):
    orm={'currency':Currency,'category':Category, 'location':Location}
    user_id=authenticated_user(request)
    if user_id:
        try:
            #get list matched
            if request.method=='GET':
                response=list(orm[key].objects.all().values_list('name',flat=True))
                return JsonResponse(response,safe=False)
            #create/update object
            elif request.method=='POST':
                body = json.loads(request.body.decode('utf-8'))
                #key = list(body.keys())[0]
                c=orm[key](name=body[key])
                c.save()
                return Response(json.dumps({key:body[key]}), status=status.HTTP_200_OK)
            #delete object
            elif request.method=='DELETE':
                body = json.loads(request.body.decode('utf-8'))
                #key = list(body.keys())[0]
                c=orm[key].objects.get(name=body[key])
                c.delete()
                return Response(json.dumps({key:body[key]}),status=status.HTTP_200_OK)
            #any bad requests
            else:
                return Response('request not supported', status=status.HTTP_405_METHOD_NOT_ALLOWED)
        except Exception as e:
            logging.error(e)    
            return JsonResponse({'error':'internal error'},status=500)
    else:
        return Response('auth required', status=status.HTTP_401_UNAUTHORIZED)

    #path('rest/v1/usersettings', rest.settings, name='user profile settings'),


     #   path('rest/v1/stat', rest.stat, name='statistical data'),


def authenticated_user(request):
    return request.session.get('_auth_user_id')
