from celery import shared_task
from django.core.management import call_command


@shared_task(name='maps.tasks.generate_hotspots')
def generate_hotspots():
    call_command('generate_hotspots', '--days', '365')
    return 'Hotspots generated successfully'
