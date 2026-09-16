scoreboard players add @s ml_a_elapsed 1
scoreboard players operation @s ml_a_tmp0 = @s ml_a_elapsed
scoreboard players operation @s ml_a_tmp0 *= #scale ml_a_tmp0
scoreboard players operation @s ml_a_tmp0 /= @s ml_a_duration
execute if score @s ml_a_tmp0 matches ..-1 run scoreboard players set @s ml_a_tmp0 0
execute if score @s ml_a_tmp0 matches 10001.. run scoreboard players set @s ml_a_tmp0 10000
function monolith:animation/easing/dispatch
scoreboard players operation @s ml_a_tmp2 = @s ml_a_to
scoreboard players operation @s ml_a_tmp2 -= @s ml_a_from
scoreboard players operation @s ml_a_value = @s ml_a_tmp2
scoreboard players operation @s ml_a_value /= #scale ml_a_tmp0
scoreboard players operation @s ml_a_value *= @s ml_a_tmp1
scoreboard players operation @s ml_a_tmp2 %= #scale ml_a_tmp0
scoreboard players operation @s ml_a_tmp2 *= @s ml_a_tmp1
scoreboard players operation @s ml_a_tmp2 /= #scale ml_a_tmp0
scoreboard players operation @s ml_a_value += @s ml_a_tmp2
scoreboard players operation @s ml_a_value += @s ml_a_from
function monolith:animation/adapter/dispatch
execute if score @s ml_a_elapsed >= @s ml_a_duration run function monolith:animation/finish
