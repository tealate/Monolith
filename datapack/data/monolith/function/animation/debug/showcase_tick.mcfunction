# Tween updates run before this timeline: each stage can finish before the next starts.
scoreboard players add @s ml_demo_time 1
execute if score @s ml_demo_time matches 1 run function monolith:animation/start {property:"scale_xyz",from:0,to:850,duration:20,easing:"out_back"}
execute if score @s ml_demo_time matches 1 run playsound minecraft:block.amethyst_block.chime master @a[distance=..24] ~ ~ ~ 0.5 1.2
execute if score @s ml_demo_time matches 21 run function monolith:animation/start {property:"translation_y",from:0,to:2200,duration:24,easing:"out_quart"}
execute if score @s ml_demo_time matches 21 run particle minecraft:end_rod ~ ~0.4 ~ 0.3 0.2 0.3 0.02 12
execute if score @s ml_demo_time matches 45 run function monolith:animation/start {property:"rotation_y",from:0,to:540000,duration:36,easing:"out_quart"}
execute if score @s ml_demo_time matches 45 run playsound minecraft:block.amethyst_block.chime master @a[distance=..24] ~ ~2.2 ~ 0.5 1.7
execute if score @s ml_demo_time matches 81 run function monolith:animation/start {property:"translation_y",from:2200,to:0,duration:30,easing:"out_bounce"}
execute if score @s ml_demo_time matches 111 run particle minecraft:end_rod ~ ~0.4 ~ 0.5 0.1 0.5 0.03 18
execute if score @s ml_demo_time matches 111 run playsound minecraft:block.amethyst_block.chime master @a[distance=..24] ~ ~ ~ 0.6 0.8
execute if score @s ml_demo_time matches 121 run function monolith:animation/start {property:"scale_xyz",from:850,to:0,duration:16,easing:"in_quart"}
execute if score @s ml_demo_time matches 137.. run kill @s
