scoreboard players operation @s ml_a_tmp0 -= #scale ml_a_tmp0
scoreboard players operation @s ml_a_tmp0 *= #two ml_a_tmp0
function monolith:animation/easing/in_quint
scoreboard players operation @s ml_a_tmp1 /= #two ml_a_tmp0
scoreboard players operation @s ml_a_tmp0 = #scale ml_a_tmp0
scoreboard players operation @s ml_a_tmp0 -= @s ml_a_tmp1
scoreboard players operation @s ml_a_tmp1 = @s ml_a_tmp0
