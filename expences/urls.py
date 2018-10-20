
from django.urls import path

#from . import views
from .views import settings
from .views import admin
from .views import main

urlpatterns = [
    path('',main.index, name='index'),
    path('init',main.init, name='users'),
    path('save',main.save, name='save'),
    path('delete',main.delete, name='delete'),
    path('table', main.table, name='table'),
    path('stat', main.aggr, name='statistics'),
    path('admin', admin.admin, name='admin'),
    path('admindata', admin.admindata, name='admindata'),
    path('admindelete', admin.admindelete, name='admindelete'),
    path('adminsave', admin.adminsave, name='adminsave'),
    path('settings', settings.settings, name='user settings'),
    path('savesettings', settings.savesettings, name='user settings'),
]
