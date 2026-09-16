scoreboard players operation @s ml_a_tmp0 *= #two ml_a_tmp0
scoreboard players operation @s ml_a_tmp0 -= #scale ml_a_tmp0
function monolith:animation/easing/out_bounce_core
scoreboard players operation @s ml_a_tmp1 += #scale ml_a_tmp0
scoreboard players operation @s ml_a_tmp1 /= #two ml_a_tmp0
