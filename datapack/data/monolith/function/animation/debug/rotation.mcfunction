# Run as a player. Three elongated displays rotate 180 degrees around Y.
function monolith:animation/debug/reset
execute anchored eyes positioned ^-3 ^-1 ^6 run summon block_display ~ ~ ~ {Tags:["monolith.debug","monolith.debug.rotation.linear"],block_state:{Name:"minecraft:white_concrete"},transformation:{translation:[-1.0f,0.0f,-0.25f],scale:[2.0f,0.5f,0.5f]},interpolation_duration:1}
execute anchored eyes positioned ^0 ^-1 ^6 run summon block_display ~ ~ ~ {Tags:["monolith.debug","monolith.debug.rotation.cubic"],block_state:{Name:"minecraft:lime_concrete"},transformation:{translation:[-1.0f,0.0f,-0.25f],scale:[2.0f,0.5f,0.5f]},interpolation_duration:1}
execute anchored eyes positioned ^3 ^-1 ^6 run summon block_display ~ ~ ~ {Tags:["monolith.debug","monolith.debug.rotation.back"],block_state:{Name:"minecraft:magenta_concrete"},transformation:{translation:[-1.0f,0.0f,-0.25f],scale:[2.0f,0.5f,0.5f]},interpolation_duration:1}
execute as @e[tag=monolith.debug.rotation.linear] run function monolith:animation/start {property:"rotation_y",from:0,to:180000,duration:60,easing:"linear"}
execute as @e[tag=monolith.debug.rotation.cubic] run function monolith:animation/start {property:"rotation_y",from:0,to:180000,duration:60,easing:"in_out_cubic"}
execute as @e[tag=monolith.debug.rotation.back] run function monolith:animation/start {property:"rotation_y",from:0,to:180000,duration:60,easing:"out_back"}
