import obd

#Callbacks
def new_rpm(r):
    print r.value

connection = obd.Async() # same constructor as 'obd.OBD()'

connection.watch(obd.commands.RPM, cllback=new_rpm) # keep track of the RPM

connection.start() # start the async update loop