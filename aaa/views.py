from django.shortcuts import render
from django.http import HttpResponse, HttpResponseRedirect
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.forms import UserCreationForm
from django.template import loader
from rest_framework import serializers
import sys, json
from django.urls import reverse_lazy
from django.views import generic
#from django.db.models import CharField
from rest_framework.validators import UniqueValidator
# Create your views here.

#list of necessary requests
# -login/reg page? - django.contrib.auth
# -select users with pagination
# -save user
# -delete user
def index(request):
    if request.session.get('_auth_user_id'):
        template = loader.get_template('aaa/index.html')
    else:
        return HttpResponseRedirect('login')
    return HttpResponse(template.render(None,request))

# response format should be: {username1:{user1},username2:{user2}}
def users(request):
    #get all users from DB in json object
    users=User.objects.all()
    answer={}
    for val in MyUserSerializer(users, many=True).data:#users.values('id','username','email','first_name','last_name'):
        answer[val['id']]=val
    resp=json.dumps(answer)
    return HttpResponse(resp, content_type="application/json")

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

def delete(request,userid):
    #implement User delete here
    user=User.objects.get(id=userid)
    user.delete()
    return HttpResponse(json.dumps({userid:None}))

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
        fields = ('id', 'username', 'first_name', 'last_name', 'email')
       
