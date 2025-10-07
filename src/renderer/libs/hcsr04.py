# Standard MicroPython library for the HC-SR04 ultrasonic sensor
from machine import Pin
import time

class HCSR04:
    def __init__(self, trigger_pin, echo_pin, echo_timeout_us=500*2*30):
        self.echo_timeout_us = echo_timeout_us
        self.trigger = Pin(trigger_pin, mode=Pin.OUT, pull=None)
        self.trigger.value(0)
        self.echo = Pin(echo_pin, mode=Pin.IN, pull=None)

    def _send_pulse_and_wait(self):
        self.trigger.value(0)
        time.sleep_us(5)
        self.trigger.value(1)
        time.sleep_us(10)
        self.trigger.value(0)
        try:
            pulse_time = time.ticks_us()
            while self.echo.value() == 0:
                if time.ticks_diff(time.ticks_us(), pulse_time) > self.echo_timeout_us:
                    return -1
            pulse_start = time.ticks_us()

            while self.echo.value() == 1:
                if time.ticks_diff(time.ticks_us(), pulse_start) > self.echo_timeout_us:
                    return -1
            pulse_end = time.ticks_us()
            
            return time.ticks_diff(pulse_end, pulse_start)
        except OSError as ex:
            return -1

    def distance_cm(self):
        pulse_duration = self._send_pulse_and_wait()
        if pulse_duration < 0:
            return -1.0
        # To calculate the distance we get the pulse_time and divide it by 2
        # (the pulse walk the distance twice) and by 29.1 because
        # the sound speed on air (343.2 m/s) is 29.1 us/cm
        cms = (pulse_duration / 2) / 29.1
        return cms

    def distance_mm(self):
        return self.distance_cm() * 10