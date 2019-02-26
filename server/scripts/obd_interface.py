import obd
import time

connection = obd.Async()

# a callback that prints every new value to the console
def print_rpm(r):
    print r.value

connection.watch(obd.commands.RPM, callback=print_rpm)
connection.start()

# the callback will now be fired upon receipt of new values

time.sleep(60)
connection.stop()