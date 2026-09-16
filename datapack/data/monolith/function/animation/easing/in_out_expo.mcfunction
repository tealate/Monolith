function monolith:animation/easing/lut/prepare
execute if score @s ml_a_lut_i matches 40.. run scoreboard players set @s ml_a_tmp1 10000
execute unless score @s ml_a_lut_i matches 40.. run function monolith:animation/easing/lut/sample/in_out_expo
