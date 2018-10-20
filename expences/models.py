from django.db import models
from datetime import datetime
from django.contrib.auth.models import User

# Create your models here.
class Expence(models.Model):
    #id = models.AutoField(primary_key=True)                    
    summ = models.FloatField()
    exptime = models.DateField()                       
    logtime = models.DateTimeField()#default=datetime.now())
    category = models.ForeignKey('Category',on_delete=models.PROTECT)
    currency = models.ForeignKey('Currency',on_delete=models.PROTECT)
    location = models.ForeignKey('Location',on_delete=models.PROTECT)
    description = models.TextField(blank=True)                       
    is_approx = models.BooleanField(default=False)                    
    is_expence = models.BooleanField(default=True)                    
    user_id = models.ForeignKey('Expuser',on_delete=models.CASCADE)

class Location(models.Model):
    name = models.TextField(max_length=50,primary_key=True)                       

class Currency(models.Model):
    name = models.TextField(max_length=3,primary_key=True)                       

class Category(models.Model):
    name = models.TextField(max_length=30,primary_key=True)

class Expuser(User):
    #user_ptr = models.OneToOneField(User,on_delete=models.CASCADE,parent_link=True)
    category = models.ForeignKey('Category',on_delete=models.PROTECT)
    currency = models.ForeignKey('Currency',on_delete=models.PROTECT)
    location = models.ForeignKey('Location',on_delete=models.PROTECT)


