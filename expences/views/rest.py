from django.http import JsonResponse, HttpResponse
from django.template import loader
from expences.models import Expuser, Expence, Location, Currency,Category
from expences.serializers import UserSettingsSerializer, ExpenceSerializer, ExpenceShortSerializer, ExpenceDateSerializer, ExpenceCatDateSerializer, ExpenceGaugeSerializer
#from django.dispatch import receiver
#from django.db.models.signals import post_save
#from django.db.models import Sum, FloatField, Count
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError, ObjectDoesNotExist
import json, logging,sys
from datetime import datetime, timedelta
from django.db.models.functions import TruncMonth

#log_level=logging.DEBUG
#log_level=logging.INFO
log_level=logging.WARNING
logging.basicConfig(level=log_level, handlers=[logging.StreamHandler(sys.stdout)])

def expences(request, exp_id=None):
    __doc__ = """Represents expence entity and its operations"""
    user_id=authenticated_user(request)
    if user_id:
        #get list matched
        if request.method=='GET':
            if exp_id:
                objects=Expence.objects.filter(id=exp_id)
                return JsonResponse(ExpenceSerializer(objects,many=True),status=200,safe=False)
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
            except ValidationError as e:
                return JsonResponse({'error':'Bad Request'},status=400)
            except Exception as e:
                logging.error('%s: %s',e.__class__, e)                
                return JsonResponse({'error':'internal error'},status=500)
        #create/update object
        elif request.method=='POST': 
            try:
                body = json.loads(request.body.decode('utf-8'))
                id=body.pop('id',exp_id)
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
                        return JsonResponse({'error':'updating error'}, status=500)
                return JsonResponse(ExpenceSerializer(Expence.objects.filter(id=id),many=True).data,safe=False)
            except Exception as e:
                logging.error(e)
                return JsonResponse({'error':'updating error'}, status=500)
        #delete object
        elif request.method=='DELETE': 
            if exp_id or exp_id==0:
                try:
                    exp=Expence.objects.get(id=exp_id, user_id=user_id)
                    exp.delete()
                    return JsonResponse(exp_id,safe=False)
                except Exception as e:
                    logging.error(e)
                    return JsonResponse({'error':'id not found'},status=404)
            else:
                return JsonResponse({'error':'Not allowed for plural'},status=405)
        #any bad requests
        else:
            return JsonResponse({'error':'request not supported'}, status=418)
    else:
        return JsonResponse({'error':'auth required'}, status=401)

## for categories,currencies and locations
def listed(request,key=None,val=None):
    __doc__ = """Represents entities entities such as Locations, Categoties, Currencies and its operations.
    Supported operations are get, add and delete. 
    Editing of existing objects are not supported but saving just reflects item to itself"""
    orm={'currency':Currency,'category':Category, 'location':Location}
    user_id=authenticated_user(request)
    if user_id:
        try:
            #get list matched
            if request.method=='GET':
                if not key:
                    return JsonResponse(list(orm.keys()),safe=False)
                if key not in orm.keys():
                    return JsonResponse({'error':'list "{0}" not found'.format(key)}, status=404) 
                if val:
                    lst=list(orm[key].objects.filter(name=val).values_list('name',flat=True))
                    response=lst[0] if len(lst) else None
                else:    
                    response=list(orm[key].objects.all().values_list('name',flat=True))
                return JsonResponse(response,safe=False)
            #create/update object
            elif request.method=='POST':
                if (not key) or (key not in orm.keys()):
                    return JsonResponse({'error':'resource not found'}, status=404)
                body = json.loads(request.body.decode('utf-8'))
                name=val or body['name']
                if not name:
                    return JsonResponse({'error':'missing parameter'}, status=400)
                c,is_created=orm[key].objects.get_or_create(name=name)
                c.save()
                return JsonResponse({key:name})
            #delete object
            elif request.method=='DELETE':
                if (not key) or (key not in orm.keys()) or (not val):
                    return JsonResponse({'error':'request not supported'}, status=405)
                try:
                    c=orm[key].objects.get(name=val)
                    c.delete()
                    return JsonResponse({key:val})
                except:
                    return JsonResponse({'error':'resource not found'}, status=404)
            #any bad requests
            else:
                return JsonResponse({'error':'request not supported'}, status=405)
        except Exception as e:
            logging.error(e)        
            return JsonResponse({'error':'internal error'},status=500)
    else:
        return JsonResponse({'error':'auth required'}, status=401)

def settings(request):
    __doc__=""" represents user settings such as default values and so on.
    Deletion is not supported."""
    user_id=authenticated_user(request)
    if user_id:
        if request.method=='GET':
            settings=UserSettingsSerializer(Expuser.objects.filter(id=user_id).first()).data
            return JsonResponse(settings)
        if request.method=='POST':
            try:
                body = json.loads(request.body.decode('utf-8'))
                user=Expuser.objects.get(id=user_id)
                user.category=Category.objects.get(name=body['category'])
                user.currency=Currency.objects.get(name=body['currency'])
                user.location=Location.objects.get(name=body['location'])
                user.save()
                return JsonResponse({'succes':'saved'})
            except ObjectDoesNotExist:
                return JsonResponse({'error':'missing or bad parameter'}, status=400)
            except Exception as e:
                logging.error(e)    
                return JsonResponse({'error':'internal error'},status=500)
        else:
            return JsonResponse({'error':'request not supported'}, status=405)
    else:
        return JsonResponse({'error':'auth required'}, status=401)

def authenticated_user(request):
    return request.session.get('_auth_user_id')

def chart_template(request):
    __doc__="""Returns JSON Vega Chart structure by name"""
    if request.method=='GET':
        fname=requests.GET.get('name',None)
        try:
            with open(fname+'.json') as f:
                return JsonResponse(json.dumps(json.load(f)))
        except IOError as e:
            return JsonResponse({'error':'not found'}, status=404)
        except json.JSONDecodeError as e:
            logging.error('Json error: %s: %s',e.doc, e.msg)                
            return JsonResponse({'error':'bad data'}, status=500)
        except Exception as e:
            logging.error('%s: %s',e.__class__, e)                
            return JsonResponse({'error':'internal error'}, status=500)
        
    else:
        return JsonResponse({'error':'request not supported'}, status=405)
