execute store result storage monolith:easing_runtime index int 1 run scoreboard players get @s ml_a_lut_i
function monolith:animation/easing/lut/read/out_elastic with storage monolith:easing_runtime
scoreboard players operation @s ml_a_lut_b = @s ml_a_lut_a
scoreboard players add @s ml_a_lut_i 1
execute store result storage monolith:easing_runtime index int 1 run scoreboard players get @s ml_a_lut_i
function monolith:animation/easing/lut/read/out_elastic with storage monolith:easing_runtime
function monolith:animation/easing/lut/interpolate
