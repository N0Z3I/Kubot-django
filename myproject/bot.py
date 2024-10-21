import os
import django
import discord
from discord import app_commands
from discord.ext import commands
import environ
from datetime import datetime
from asyncio import sleep as s

# โหลด environment variables จากไฟล์ .env
env = environ.Env()
environ.Env.read_env()

# ตั้งค่า Django Settings
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "myproject.settings")
django.setup()

from accounts.models import DiscordProfile

intents = discord.Intents.default()
intents.members = True
intents.message_content = True

bot = commands.Bot(command_prefix="!", intents=intents)

@bot.event
async def on_ready():
    await bot.change_presence(status=discord.Status.online, activity=discord.Game('/help'))
    print(f"{bot.user.name} has connected to Discord!")
    try:
        synced = await bot.tree.sync()
        print(f"Synced {len(synced)} commands.")
    except Exception as e:
        print(f"Error syncing commands: {e}")

@bot.tree.command(name="hello", description="ทักทาย Hello World!")
async def hello(interaction: discord.Interaction):
    await interaction.response.send_message("Hello World!")

@bot.tree.command(name="invite", description="รับลิงก์เชิญบอท KuBot")
async def invite(interaction: discord.Interaction):
    embed = discord.Embed(
        color=discord.Color.dark_teal(),
        url="https://discord.com/oauth2/authorize?client_id=1234209115878723704&permissions=8&scope=bot",
        description="KuBot เป็นวิธีที่ง่ายที่สุดในการจัดการการศึกษาของคุณ",
        title="เชิญฉันเข้าสู่เซิร์ฟเวอร์ของคุณ คลิกที่นี่!"
    )
    await interaction.response.send_message(embed=embed)

@bot.tree.command(name="ping", description="ตรวจสอบ ping ของบอท")
async def ping(interaction: discord.Interaction):
    # คำนวณความหน่วงของบอท
    bot_latency = round(bot.latency * 1000, 2)

    # สร้าง Embed เพื่อนำเสนอผลลัพธ์
    embed = discord.Embed(
        title="🏓 Pong!",
        description="เช็คสถานะ Ping ของบอท",
        color=discord.Color.dark_teal()
    )
    
    # เพิ่มข้อมูล latency
    embed.add_field(name="Latency:", value=f"`{bot_latency}` ms", inline=False)

    # ส่ง Embed ไปยัง Discord
    await interaction.response.send_message(embed=embed)

@bot.tree.command(name="avatar", description="ดู Avatar ของผู้ใช้")
@app_commands.describe(member="สมาชิกที่ต้องการดู Avatar")
async def avatar(interaction: discord.Interaction, member: discord.Member = None):
    if member is None:
        member = interaction.user
    embed = discord.Embed(title=f"{member}'s Avatar", color=discord.Color.dark_teal())
    embed.set_image(url=member.avatar.url)
    await interaction.response.send_message(embed=embed)

@bot.tree.command(name="profile", description="ดูโปรไฟล์ของผู้ใช้")
@app_commands.describe(user="สมาชิกที่ต้องการดูโปรไฟล์")
async def profile(interaction: discord.Interaction, user: discord.Member = None):
    if user is None:
        user = interaction.user
    embed = discord.Embed(color=discord.Color.dark_teal())
    embed.set_thumbnail(url=user.avatar)
    embed.set_author(name=user.name)
    embed.add_field(name="Mention:", value=user.mention, inline=True)
    embed.add_field(name="User ID:", value=user.id, inline=True)
    embed.add_field(name="Bot:", value=user.bot, inline=True)
    embed.add_field(name="Created at:", value=user.created_at.strftime("%B %d %Y, %T"), inline=True)
    embed.add_field(name="Joined at:", value=user.joined_at.strftime("%B %d %Y, %T"), inline=True)
    await interaction.response.send_message(embed=embed)

@bot.tree.command(name="clear", description="ลบข้อความในช่องแชท")
@app_commands.describe(amount="จำนวนข้อความที่จะลบ")
async def clear(interaction: discord.Interaction, amount: int = 5):
    await interaction.channel.purge(limit=amount)
    await interaction.response.send_message(f"ลบข้อความ {amount} ข้อความเรียบร้อยแล้ว", ephemeral=True)

@bot.tree.command(name="reminder", description="ตั้งการแจ้งเตือนเป็นระยะ")
@app_commands.describe(time="เวลาระหว่างแจ้งเตือน (นาที)", msg="ข้อความที่จะแจ้งเตือน")
async def reminder(interaction: discord.Interaction, time: int, msg: str):
    await interaction.response.send_message(f"การแจ้งเตือน `{msg}` จะถูกส่งทุกๆ {time} นาที")
    while True:
        await s(60 * time)
        await interaction.channel.send(f"{msg}, {interaction.user.mention}")

@bot.tree.command(name="activity", description="ดูข้อมูลกิจกรรมของ Ku")
async def activity(interaction: discord.Interaction):
    embed = discord.Embed(
        color=discord.Color.dark_teal(),
        description="ลองดูลิงก์ที่มีประโยชน์เหล่านี้เพื่อดูกิจกรรมที่เกี่ยวข้องกับ Ku",
        title="กิจกรรม"
    )
    view = discord.ui.View()
    view.add_item(discord.ui.Button(label="ปฏิทินการศึกษา", style=discord.ButtonStyle.link, url="https://ead.kps.ku.ac.th/2021/index.php?Itemid=162"))
    view.add_item(discord.ui.Button(label="ประเมินการเรียนการสอน", style=discord.ButtonStyle.link, url="https://eassess.ku.ac.th/m/"))
    await interaction.response.send_message(embed=embed, view=view)

@bot.tree.command(name="server", description="ดูข้อมูลเซิร์ฟเวอร์ปัจจุบัน")
async def server(interaction: discord.Interaction):
    guild = interaction.guild
    embed = discord.Embed(color=discord.Color.dark_teal())
    embed.set_thumbnail(url=guild.icon)
    embed.set_author(name=guild.name, icon_url=guild.icon)
    embed.add_field(name="👑 Owner:", value=guild.owner.mention, inline=True)
    embed.add_field(name="💬 Channels:", value=len(guild.channels), inline=True)
    embed.add_field(name="👥 Members:", value=guild.member_count, inline=True)
    embed.add_field(name="📆 Created at:", value=guild.created_at.strftime("%B %d %Y, %T"), inline=True)
    embed.add_field(name="🆔 Server ID:", value=guild.id, inline=True)
    await interaction.response.send_message(embed=embed)

bot.run(env("DISCORD_BOT_TOKEN"))
