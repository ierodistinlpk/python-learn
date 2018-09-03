from django.urls import path

from . import views

urlpatterns = [
    path('',views.index, name='index'),
    path('init',views.init, name='users'),
    path('save',views.save, name='save'),
    path('delete',views.delete, name='delete'),
#    path('edit', views.edit, name='edit'),
    path('table', views.table, name='table'),
]
