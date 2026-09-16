# Macro API: execute as <display> run function monolith:animation/start {property:"translation_y",from:0,to:3000,duration:20,easing:"out_quad"}
tag @s remove monolith.animating
$scoreboard players set @s ml_a_from $(from)
$scoreboard players set @s ml_a_to $(to)
$scoreboard players set @s ml_a_duration $(duration)
scoreboard players set @s ml_a_elapsed 0
$function monolith:animation/easing/resolve/$(easing)
$function monolith:animation/adapter/resolve/$(property)
execute if score @s ml_a_duration matches ..0 run function monolith:animation/finish
execute if score @s ml_a_duration matches 1.. run tag @s add monolith.animating
