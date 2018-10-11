
from django.urls import path

from . import views

urlpatterns = [
    path('',views.index, name='index'),
    path('init',views.init, name='users'),
    path('save',views.save, name='save'),
    path('delete',views.delete, name='delete'),
    path('table', views.table, name='table'),
    path('admin', views.admin, name='admin'),
    path('admindata', views.admindata, name='admindata'),
    path('admindelete', views.admindelete, name='admindelete'),
    path('adminsave', views.adminsave, name='adminsave'),
    path('settings', views.settings, name='user settings'),
    path('savesettings', views.savesettings, name='user settings'),
]
