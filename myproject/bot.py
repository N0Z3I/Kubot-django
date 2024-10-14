import discord
from discord.ext import commands
import os
import django
from django.conf import settings
from accounts.models import DiscordProfile

# ตั้งค่าให้ Django ทำงานภายในบอท
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "myproject.settings")  # เปลี่ยน myproject เป็นชื่อโปรเจกต์จริง ๆ ของคุณ
django.setup()

# สร้าง instance ของบอท
intents = discord.Intents.default()
intents.messages = True  # เปิดใช้งาน intent สำหรับข้อความ
intents.members = True  # เปิดใช้งาน intent สำหรับการดูข้อมูลสมาชิก
bot = commands.Bot(command_prefix="!", intents=intents)

# เมื่อบอทพร้อมทำงาน
@bot.event
async def on_ready():
    print(f'{bot.user} has connected to Discord!')

# คำสั่งให้บอทแสดงข้อมูลนิสิตที่เชื่อมต่อ
@bot.command(name="student_info")
async def student_info(ctx, discord_user: discord.Member):
    try:
        # ค้นหานิสิตจากฐานข้อมูลที่ใช้ discord_id ตรงกับผู้ใช้ Discord ที่เชื่อมต่อ
        profile = DiscordProfile.objects.get(discord_id=str(discord_user.id))
        # แสดงข้อมูลนิสิตที่เชื่อมต่อ
        student_data = (
            f"ชื่อ Discord: {profile.discord_username}#{profile.discord_discriminator}\n"
            f"รหัสนิสิต: {profile.user.studentprofile.student_id}\n"
            f"ชื่อ: {profile.user.studentprofile.first_name} {profile.user.studentprofile.last_name}\n"
            f"GPAX: {profile.user.studentprofile.gpax.gpa}"
        )
        await ctx.send(f"ข้อมูลนิสิตที่เชื่อมต่อ: \n{student_data}")
    except DiscordProfile.DoesNotExist:
        await ctx.send("ไม่พบนิสิตที่เชื่อมต่อกับผู้ใช้นี้")

# เริ่มต้นบอท
bot.run(os.getenv("DISCORD_BOT_TOKEN"))
