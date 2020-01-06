from django.urls import path

from . import views

urlpatterns = [
    path('',views.index, name='index'),
    path('users',views.users, name='users'),
#    path('user/<int:userid>',views.user, name='user'),
    path('save',views.save, name='save'),
    path('delete/<int:userid>',views.delete, name='delete'),
    path('register/', views.SignUp.as_view(), name='register'),
    path('confirmuser', views.confirmUser, name='confirmuser'),    
]
