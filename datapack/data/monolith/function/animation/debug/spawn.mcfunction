# Internal macro used by debug/all.
$execute anchored eyes positioned ^$(x) ^-1 ^$(z) run summon block_display ~ ~ ~ {Tags:["monolith.debug","monolith.debug.$(easing)"],block_state:{Name:"minecraft:$(block)"},interpolation_duration:1}
$execute as @e[tag=monolith.debug.$(easing)] run function monolith:animation/start {property:"translation_y",from:0,to:3000,duration:60,easing:"$(easing)"}
