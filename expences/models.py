from django.db import models
from datetime import datetime
from django.contrib.auth.models import User

# Create your models here.
class Expence(models.Model):
    '''stores one expence/income item. '''
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
    exchange_rate = models.DateField(blank=True, default=1) # exchange rate. Just saving per record. all logic should be in GUI.                       
    
class Location(models.Model):
    '''Global locations list'''
    name = models.TextField(max_length=50,primary_key=True)                       

class UserLocation(models.Model):
    '''Per user shown locations list'''
    user_id = models.ForeignKey('Expuser',on_delete=models.PROTECT)
    name = models.ForeignKey('Location',on_delete=models.PROTECT)                       
    priority = models.IntegerField()
    
class Currency(models.Model):
    name = models.TextField(max_length=3,primary_key=True)                       

class UserCurrency(models.Model):
    '''Per user shown currencies list'''
    user_id = models.ForeignKey('Expuser',on_delete=models.PROTECT)
    name = models.ForeignKey('Currency',on_delete=models.PROTECT)                       
    priority = models.IntegerField()

class Category(models.Model):
    name = models.TextField(max_length=30,primary_key=True)

class UserCategory(models.Model):
    '''Per user shown locations list'''
    user_id = models.ForeignKey('Expuser',on_delete=models.PROTECT)
    name = models.ForeignKey('Category',on_delete=models.PROTECT)                       
    priority = models.IntegerField()

class Expuser(User):
    #user_ptr = models.OneToOneField(User,on_delete=models.CASCADE,parent_link=True)
    category = models.ForeignKey('Category',on_delete=models.PROTECT)
    currency = models.ForeignKey('Currency',on_delete=models.PROTECT)
    location = models.ForeignKey('Location',on_delete=models.PROTECT)

class ExcangeRate(models.Model):
    currency_from= models.ForeignKey('Currency',on_delete=models.PROTECT, related_name='currency_from')
    currency_to= models.ForeignKey('Currency',on_delete=models.PROTECT, related_name='currency_to')
    exchange_date= models.DateField()
