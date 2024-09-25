import os
import discord
import requests
from discord.ext import commands


# Environment variables
DISCORD_TOKEN = "MTI4NjA3MDI5NzQwOTA5Nzc4OQ.G6YO4U.ZORcFMkT_m5fbZM6AY8c6LTgrA3Cinguu5bPUQ"  # Your bot token
BASE_URL = "http://127.0.0.1:8000/api/v1/auth"  # Your Django API URL

# Create a Discord bot instance
intents = discord.Intents.default()
intents.message_content = True  # To allow bot to read message content
bot = commands.Bot(command_prefix="!", intents=intents)

@bot.command(name='student')
async def student_data(ctx, username: str, password: str):
    # Send login request to the Django API
    login_url = f"{BASE_URL}/register-and-login-student/"
    payload = {
        'username': username,
        'password': password
    }

    response = requests.post(login_url, json=payload)

    if response.status_code == 201:
        data = response.json()

        # Extract and format student data
        first_name = data.get('first_name_th', 'N/A')
        last_name = data.get('last_name_th', 'N/A')
        schedule = data.get('schedule', {}).get('results', [])
        group_courses = data.get('group_course', {}).get('results', [])

        # Start building the message
        message = f"**Student Data**\n\n"
        message += f"**First Name (TH):** {first_name}\n"
        message += f"**Last Name (TH):** {last_name}\n\n"

        # Add schedule details
        if schedule:
            for entry in schedule:
                academic_year = entry.get('academicYr', 'N/A')
                semester = entry.get('semester', 'N/A')
                message += f"**Academic Year:** {academic_year}\n"
                message += f"**Semester:** {semester}\n"

        # Add group course details
        if group_courses:
            for course in group_courses:
                period_date = course.get('peroid_date', 'N/A')
                message += f"\n**Course Period:** {period_date}\n"
                for subject in course.get('course', []):
                    subject_name_th = subject.get('subject_name_th', 'N/A')
                    subject_name_en = subject.get('subject_name_en', 'N/A')
                    section_code = subject.get('section_code', 'N/A')
                    teacher_name = subject.get('teacher_name', 'N/A')
                    day = subject.get('day_w', 'N/A')
                    time_from = subject.get('time_from', 'N/A')
                    time_to = subject.get('time_to', 'N/A')
                    room_name = subject.get('room_name_th', 'N/A')

                    message += f"**Subject:** {subject_name_th} / {subject_name_en}\n"
                    message += f"**Section Code:** {section_code}\n"
                    message += f"**Teacher:** {teacher_name}\n"
                    message += f"**Day:** {day}\n"
                    message += f"**Time:** {time_from} - {time_to}\n"
                    message += f"**Room:** {room_name}\n\n"

        # Send the message back in Discord
        await ctx.send(message)

    else:
        await ctx.send("Failed to fetch student data. Check your credentials.")

# Run the bot
bot.run(DISCORD_TOKEN)
