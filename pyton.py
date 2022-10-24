from operator import length_hint
import random

print('Password Generator')

chars = 'qwertyuiopasdfhjklzxcvbnm1234567890!@#$%^&*():?'

number = input('How many passwords you want to be generated?')
number = int(number)

length = input('Your password length')
length = int(length)

print('\nyour passwords:')

for passw in range (number):
	passwords = ''
	for a in range(length):
		passwords += random.choice(chars)
	print(passwords)