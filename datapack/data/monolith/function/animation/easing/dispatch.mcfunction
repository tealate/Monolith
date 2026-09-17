# Shared entry point clamps input only and guarantees exact endpoints.
execute if score @s ml_a_tmp0 matches ..0 run return run scoreboard players set @s ml_a_tmp1 0
execute if score @s ml_a_tmp0 matches 10000.. run return run scoreboard players set @s ml_a_tmp1 10000
execute if score @s ml_a_easing matches 0 run function monolith:animation/easing/linear
execute if score @s ml_a_easing matches 1 run function monolith:animation/easing/in_quad
execute if score @s ml_a_easing matches 2 run function monolith:animation/easing/out_quad
execute if score @s ml_a_easing matches 3 run function monolith:animation/easing/in_out_quad
execute if score @s ml_a_easing matches 4 run function monolith:animation/easing/out_back
execute if score @s ml_a_easing matches 5 run function monolith:animation/easing/in_cubic
execute if score @s ml_a_easing matches 6 run function monolith:animation/easing/out_cubic
execute if score @s ml_a_easing matches 7 run function monolith:animation/easing/in_out_cubic
execute if score @s ml_a_easing matches 8 run function monolith:animation/easing/in_back
execute if score @s ml_a_easing matches 9 run function monolith:animation/easing/in_out_back
execute if score @s ml_a_easing matches 10 run function monolith:animation/easing/out_bounce
execute if score @s ml_a_easing matches 11 run function monolith:animation/easing/in_bounce
execute if score @s ml_a_easing matches 12 run function monolith:animation/easing/in_out_bounce
execute if score @s ml_a_easing matches 13 run function monolith:animation/easing/in_sine
execute if score @s ml_a_easing matches 14 run function monolith:animation/easing/out_sine
execute if score @s ml_a_easing matches 15 run function monolith:animation/easing/in_out_sine
execute if score @s ml_a_easing matches 16 run function monolith:animation/easing/in_quart
execute if score @s ml_a_easing matches 17 run function monolith:animation/easing/out_quart
execute if score @s ml_a_easing matches 18 run function monolith:animation/easing/in_out_quart
execute if score @s ml_a_easing matches 19 run function monolith:animation/easing/in_quint
execute if score @s ml_a_easing matches 20 run function monolith:animation/easing/out_quint
execute if score @s ml_a_easing matches 21 run function monolith:animation/easing/in_out_quint
execute if score @s ml_a_easing matches 22 run function monolith:animation/easing/in_expo
execute if score @s ml_a_easing matches 23 run function monolith:animation/easing/out_expo
execute if score @s ml_a_easing matches 24 run function monolith:animation/easing/in_out_expo
execute if score @s ml_a_easing matches 25 run function monolith:animation/easing/in_circ
execute if score @s ml_a_easing matches 26 run function monolith:animation/easing/out_circ
execute if score @s ml_a_easing matches 27 run function monolith:animation/easing/in_out_circ
execute if score @s ml_a_easing matches 28 run function monolith:animation/easing/in_elastic
execute if score @s ml_a_easing matches 29 run function monolith:animation/easing/out_elastic
execute if score @s ml_a_easing matches 30 run function monolith:animation/easing/in_out_elastic
