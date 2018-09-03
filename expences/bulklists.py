from expences.models import Location, Currency,Category

Loc=['LPK','VRN','MSK','SPB','Crete']
for loc in Loc:
    t=Location.objects.get_or_create(name=loc)
    
Curr=['RUB','EUR','USD','AUD','NZD']
for nam in Curr:
    t=Currency.objects.get_or_create(name=nam)
  
Cat=['бензак','авто','еда','снаряга','квартплата']
for nam in Cat:
    t=Category.objects.get_or_create(name=nam)
