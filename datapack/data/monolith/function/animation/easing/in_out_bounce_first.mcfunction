scoreboard players operation @s ml_a_tmp0 *= #two ml_a_tmp0
scoreboard players operation @s ml_a_tmp1 = #scale ml_a_tmp0
scoreboard players operation @s ml_a_tmp1 -= @s ml_a_tmp0
scoreboard players operation @s ml_a_tmp0 = @s ml_a_tmp1
function monolith:animation/easing/out_bounce_core
scoreboard players operation @s ml_a_tmp0 = #scale ml_a_tmp0
scoreboard players operation @s ml_a_tmp0 -= @s ml_a_tmp1
scoreboard players operation @s ml_a_tmp0 /= #two ml_a_tmp0
scoreboard players operation @s ml_a_tmp1 = @s ml_a_tmp0
