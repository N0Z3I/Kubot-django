# Generated by Django 5.0.6 on 2024-10-27 22:04

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0012_rename_subject_name_grade_subject_name_th_grade_gpa_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='studentprofile',
            name='ku_email',
            field=models.EmailField(blank=True, max_length=254, null=True),
        ),
    ]
