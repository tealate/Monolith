# Run as a player. Five blocks rise three blocks over 60 ticks.
function monolith:animation/debug/reset
execute anchored eyes positioned ^-4 ^-1 ^6 run summon block_display ~ ~ ~ {Tags:["monolith.debug","monolith.debug.linear"],block_state:{Name:"minecraft:white_concrete"},interpolation_duration:1}
execute anchored eyes positioned ^-2 ^-1 ^6 run summon block_display ~ ~ ~ {Tags:["monolith.debug","monolith.debug.in_quad"],block_state:{Name:"minecraft:light_blue_concrete"},interpolation_duration:1}
execute anchored eyes positioned ^0 ^-1 ^6 run summon block_display ~ ~ ~ {Tags:["monolith.debug","monolith.debug.out_quad"],block_state:{Name:"minecraft:lime_concrete"},interpolation_duration:1}
execute anchored eyes positioned ^2 ^-1 ^6 run summon block_display ~ ~ ~ {Tags:["monolith.debug","monolith.debug.in_out_quad"],block_state:{Name:"minecraft:orange_concrete"},interpolation_duration:1}
execute anchored eyes positioned ^4 ^-1 ^6 run summon block_display ~ ~ ~ {Tags:["monolith.debug","monolith.debug.out_back"],block_state:{Name:"minecraft:magenta_concrete"},interpolation_duration:1}
execute as @e[tag=monolith.debug.linear] run function monolith:animation/start {property:"translation_y",from:0,to:3000,duration:60,easing:"linear"}
execute as @e[tag=monolith.debug.in_quad] run function monolith:animation/start {property:"translation_y",from:0,to:3000,duration:60,easing:"in_quad"}
execute as @e[tag=monolith.debug.out_quad] run function monolith:animation/start {property:"translation_y",from:0,to:3000,duration:60,easing:"out_quad"}
execute as @e[tag=monolith.debug.in_out_quad] run function monolith:animation/start {property:"translation_y",from:0,to:3000,duration:60,easing:"in_out_quad"}
execute as @e[tag=monolith.debug.out_back] run function monolith:animation/start {property:"translation_y",from:0,to:3000,duration:60,easing:"out_back"}
