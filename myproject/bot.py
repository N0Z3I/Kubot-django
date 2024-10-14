import os
import django
import discord
from discord.ext import commands
import environ

# โหลด environment variables จากไฟล์ .env
env = environ.Env()
environ.Env.read_env()  # อ่านจากไฟล์ .env

# ตั้งค่า environment variable DJANGO_SETTINGS_MODULE ให้ชี้ไปยัง settings.py ของโปรเจกต์หลัก
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "myproject.settings")

# เรียก setup เพื่อให้ Django โหลดการตั้งค่า
django.setup()  # ต้องเรียก setup ก่อนที่จะเรียกใช้งานโมเดล

# Import โมเดลหลังจาก django.setup() แล้วเท่านั้น
from accounts.models import DiscordProfile

# โค้ดบอทเริ่มต้นที่นี่
intents = discord.Intents.default()
intents.messages = True
intents.members = True
bot = commands.Bot(command_prefix="!", intents=intents)

@bot.event
async def on_ready():
    print(f'{bot.user} has connected to Discord!')

@bot.command(name="student_info")
async def student_info(ctx):
    try:
        # ดึง Discord ID ของผู้ใช้ที่ใช้คำสั่ง
        discord_user_id = str(ctx.author.id)
        
        # ค้นหานิสิตจากฐานข้อมูลที่ใช้ discord_id ตรงกับผู้ใช้ Discord ที่เชื่อมต่อ
        profile = DiscordProfile.objects.get(discord_id=discord_user_id)
        
        # สร้างข้อมูลนิสิตที่เชื่อมต่อ
        student_data = (
            f"ชื่อ Discord: {profile.discord_username}#{profile.discord_discriminator}\n"
            f"รหัสนิสิต: {profile.user.studentprofile.student_id}\n"
            f"ชื่อ: {profile.user.studentprofile.first_name} {profile.user.studentprofile.last_name}\n"
            f"GPAX: {profile.user.studentprofile.gpax.gpa}"
        )
        
        # ส่งข้อมูลนิสิตกลับไปยัง Discord
        await ctx.send(f"ข้อมูลนิสิตของคุณ: \n{student_data}")
        
    except DiscordProfile.DoesNotExist:
        await ctx.send("ไม่พบนิสิตที่เชื่อมต่อกับบัญชี Discord นี้")

bot.run(env("DISCORD_BOT_TOKEN"))
