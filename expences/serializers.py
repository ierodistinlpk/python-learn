from expences.models import Expuser, Expence#, Location, Currency,Category
from rest_framework import serializers

class UserSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expuser
        fields = ('currency','location','category')

class ExpenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expence
        exclude = ('logtime','user_id')

class ExpenceShortSerializer(ExpenceSerializer):
    class Meta:
        model = Expence
        exclude=('is_approx','is_expence','location','logtime','user_id','category')

class ExpenceDateSerializer(serializers.Serializer):
    summ=serializers.FloatField()
    exptime=serializers.DateField()
    currency=serializers.CharField()

class ExpenceCatDateSerializer(ExpenceDateSerializer):
    category=serializers.CharField()

class ExpenceGaugeSerializer(serializers.Serializer):
    summ=serializers.FloatField()
    month=serializers.DateField()
    currency=serializers.CharField()
    is_expence=serializers.BooleanField()
