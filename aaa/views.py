from django.shortcuts import render
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout, REDIRECT_FIELD_NAME
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.decorators import login_required
from django.template import loader
from rest_framework import serializers
import sys, json
from django.urls import reverse_lazy
from django.views import generic
from django.shortcuts import resolve_url
from django.conf import settings

#from django.db.models import CharField
from rest_framework.validators import UniqueValidator
from functools import wraps
# Create your views here.

#list of necessary requests
# -login/reg page? - django.contrib.auth
# -select users with pagination
# -save user
# -delete user



def rest_user_passes_test(test_func, login_url=None, redirect_required=False, redirect_url=None, redirect_field_name=REDIRECT_FIELD_NAME, err_code=403, err_message='forbidden'):
    """
    Decorator for views that checks that the user passes the given test,
    redirecting to the log-in page if necessary. The test should be a callable
    that takes the user object and returns True if the user passes.
    """

    def decorator(view_func):
        @wraps(view_func)
        def _wrapped_view(request, *args, **kwargs):
            if test_func(request.user):
                return view_func(request, *args, **kwargs)
            if redirect_required:
                resolved_login_url = resolve_url(login_url or settings.LOGIN_URL)
                from django.contrib.auth.views import redirect_to_login
                return redirect_to_login(
                    redirect_url, resolved_login_url, redirect_field_name)
            else:
                return JsonResponse({'error':err_message}, status=err_code)
        return _wrapped_view
    return decorator

def rest_login_required(function=None, redirect_url=None, login_url=None):
    """
    Decorator for views that checks that the user is logged in, redirecting
    to the log-in page if necessary.
    """
    actual_decorator = rest_user_passes_test(
        lambda u: u.is_authenticated,
        login_url=login_url,
        redirect_url=redirect_url,
        redirect_required=True
    )
    if function:
        return actual_decorator(function)
    return actual_decorator

def rest_admin_required(function=None, redirect_url=None, login_url=None):
    """
    Decorator for views that checks that the user has admin rights.
    """
    actual_decorator = rest_user_passes_test(
        lambda u: u.is_staff
    )
    if function:
        return actual_decorator(function)
    return actual_decorator

    
@login_required #(next='/aaa/')
def index(request):
    if request.session.get('_auth_user_id'):
        template = loader.get_template('aaa/index.html')
    else:
        return HttpResponseRedirect('login')
    return HttpResponse(template.render(None,request))

# response format should be: {username1:{user1},username2:{user2}}
@rest_login_required(redirect_url='/aaa')
@rest_admin_required
def users(request):
    #get all users from DB in json object
    users=User.objects.all()
    answer={}
    for val in MyUserSerializer(users, many=True).data:#users.values('id','username','email','first_name','last_name','is_active'):
        answer[val['id']]=val
    resp=json.dumps(answer)
    return HttpResponse(resp, content_type="application/json")

@rest_login_required(redirect_url='/aaa')
@rest_admin_required
def save(request):
    # parse request for params and process User.update
    body_unicode = request.body.decode('utf-8')
    body = json.loads(body_unicode)
    #print (item.validated_data, file=sys.stderr)
    if 'id' not in body:
        return HttpResponse(json.dumps({'error':'user id can\'t be empty'}))
    userid=body['id']
    if 'password' in body:
      #  print (body['password'], file=sys.stderr)
        try:
            user=User.objects.get(id=userid)
            user.set_password(body['password'])
            user.save()
        except Exception as e:
            print (e.message, file=sys.stderr)
            return HttpResponse(json.dumps({'error':'password update failed for username'+usernam}))
    else:
        item = MyUserSerializer(data=body)
        if not item.is_valid():
            print (item.errors, file=sys.stderr)
            return HttpResponse(json.dumps({'error':item.errors}))
        try:
            if (userid == ""):
                if User.objects.filter(username=item.validated_data['username']).exists():
                    return HttpResponse(json.dumps({'error':'username has been alreay used'}))
                user=User(username=body['username'],email=body['email'],first_name=body['first_name'],last_name=body['last_name'])
            #user=User(item.validated_data)
                user.save()
            else:
                user=User.objects.get(id=userid)
                user.email=body['email']
                user.username=body['username']
                user.first_name=body['first_name']
                user.last_name=body['last_name']
                user.save()
        except Exception as e:
            print (e, file=sys.stderr)
            return HttpResponse(json.dumps({'error':'update failed for username'+item.validated_data['username']}))   
    answer={user.id:MyUserSerializer(user).data}
    #print (answer, file=sys.stderr)
    return HttpResponse(json.dumps(answer))

@rest_login_required(redirect_url='/aaa')
@rest_admin_required
def delete(request,userid):
    user_id=request.session.get('_auth_user_id')
    user=User.objects.get(id=userid)
    user.delete()
    return HttpResponse(json.dumps({userid:None}))

@rest_login_required(redirect_url='/aaa')    
@rest_admin_required
def confirmUser(request,userid):
    pass
                
class SignUp(generic.CreateView):
    form_class = UserCreationForm
    success_url = reverse_lazy('login')
    template_name = 'registration/reg.html'


def my_user_validator(value):
    print('validation:', file=sys.stderr)
    print(value, file=sys.stderr)
    if (len(value)<1 or ' ' in value):
        raise serializers.ValidationError({'username': "Please provide a correct username"})

class MyUserSerializer(serializers.ModelSerializer):
    username = serializers.CharField(validators=[my_user_validator]) 
    class Meta:
        model = User
        fields = ('id', 'username', 'first_name', 'last_name', 'email','is_active')
       
