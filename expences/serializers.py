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

class ExpenceDateSerializer(serializers.Serializer):
    summ=serializers.FloatField()
    exptime=serializers.DateField()
    currency=serializers.CharField()

class ExpenceCatDateSerializer(ExpenceDateSerializer):
    category=serializers.CharField()
