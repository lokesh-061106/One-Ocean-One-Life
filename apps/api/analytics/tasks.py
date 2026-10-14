from celery import shared_task
from django.core.management import call_command
from django.utils import timezone


@shared_task(name='analytics.tasks.generate_monthly_trends')
def generate_monthly_trends():
    year = timezone.now().year
    call_command('generate_monthly_trends', '--year', str(year))
    return f'Monthly trends for {year} generated'


@shared_task(name='analytics.tasks.generate_annual_report')
def generate_annual_report(year=None):
    if year is None:
        year = timezone.now().year - 1
    call_command('generate_annual_report', '--year', str(year))
    return f'Annual report for {year} generated'
