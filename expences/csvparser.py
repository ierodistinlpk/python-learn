from expences.models import Location, Currency,Category, Expence, Expuser
import sys
import codecs
from datetime import date, datetime
#read file to plain list of objects

def parseFile(filename,month):
    f=codecs.open(filename,'r',)
    arr=[]
    for line in f:
        arr.append(line)
    headers=arr[0].split(';')
    res=[]
    incomes=[]
    for data in arr[1:]:
        line=data.split(';')
        edate=date(2018,int(month),int(line[2]))
        if line[1]:
            (cat,false)=Category.objects.get_or_create(name='income')
            if line[1][0]=='=':
                for exp in line[1][1:].split('+'):
                    incomes.append({'exptime':edate, 'description':line[0], 'summ':eval(exp),'is_expence':False,
                                    'category':cat,
                                    'currency':Currency.objects.get(name='rub'),
                                    'logtime': datetime.now(),
                                    'location': Location.objects.get(name='LPK'),
                                    'user_id':Expuser.objects.get(id=45)
                                
                    })     
            else:
                incomes.append({'exptime':edate, 'description':line[0], 'summ':eval(line[1]),'is_expence':False,
                                'category':cat,
                                'currency':Currency.objects.get(name='rub'),
                                'logtime': datetime.now(),
                                'location': Location.objects.get(name='LPK'),
                                'user_id':Expuser.objects.get(id=45)
                                
                })
        for i in range(3,10):#len(line)):
            if line[i]:
                #descr = line[10] if (i!=3) else ''
                descr=''
                (cat,false)=Category.objects.get_or_create(name=headers[i])
                if line[i][0]=='=':
                    for exp in line[i][1:].split('+'):
                        res.append({'exptime':edate, 'summ':eval(exp), 'category':cat,'description':descr,
                                    'currency':Currency.objects.get(name='rub'),
                                    'logtime':datetime.now(),
                                    'location':Location.objects.get(name='LPK'),
                                    'user_id':Expuser.objects.get(id=45)
                        })
                else:
                    res.append({'exptime':edate, 'summ':eval(line[i]), 'category':cat,'description':descr,
                                'currency':Currency.objects.get(name='rub'),
                                'logtime':datetime.now(),
                                'location':Location.objects.get(name='LPK'),
                                'user_id':Expuser.objects.get(id=45)
                    })
            
    return (incomes,res)

#sys.path.insert(0, './expences')
#print (parseFile(sys.argv[1]))
#parseFile(sys.argv[1],sys.argv[2])


# +(a,b)=parseFile('expences/mar.csv','03')
# +(a,b)=parseFile('expences/apr.csv','04')
# +(a,b)=parseFile('expences/may.csv','05')
# +(a,b)=parseFile('expences/jun.csv','06')
# +(a,b)=parseFile('expences/jul.csv','07')
# (a,b)=parseFile('expences/august.csv','08')


# for i in a:
#     inc=Expence(**i)
#     inc.save()

# for e in b:
#     ex=Expence(**e)
#     ex.save()
