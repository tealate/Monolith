scoreboard players operation @s ml_a_value = @s ml_a_to
function monolith:animation/adapter/dispatch
tag @s remove monolith.animating
scoreboard players set @s ml_a_elapsed 0
scoreboard players set @s ml_a_duration 0
