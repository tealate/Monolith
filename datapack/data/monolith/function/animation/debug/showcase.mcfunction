# Three staggered crystals; level placement is independent of player pitch.
kill @e[tag=monolith.showcase]
execute at @s rotated ~ 0 positioned ^-2.5 ^1 ^6 run summon block_display ~ ~ ~ {Tags:["monolith.debug","monolith.showcase","monolith.showcase.left"],block_state:{Name:"minecraft:amethyst_block"},brightness:{block:15,sky:15},transformation:{translation:[0f,0f,0f],scale:[0f,0f,0f],left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f]}}
execute at @s rotated ~ 0 positioned ^0 ^1 ^6 run summon block_display ~ ~ ~ {Tags:["monolith.debug","monolith.showcase","monolith.showcase.center"],block_state:{Name:"minecraft:sea_lantern"},brightness:{block:15,sky:15},transformation:{translation:[0f,0f,0f],scale:[0f,0f,0f],left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f]}}
execute at @s rotated ~ 0 positioned ^2.5 ^1 ^6 run summon block_display ~ ~ ~ {Tags:["monolith.debug","monolith.showcase","monolith.showcase.right"],block_state:{Name:"minecraft:gold_block"},brightness:{block:15,sky:15},transformation:{translation:[0f,0f,0f],scale:[0f,0f,0f],left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f]}}
scoreboard players set @e[tag=monolith.showcase.left] ml_demo_time 0
scoreboard players set @e[tag=monolith.showcase.center] ml_demo_time -8
scoreboard players set @e[tag=monolith.showcase.right] ml_demo_time -16
