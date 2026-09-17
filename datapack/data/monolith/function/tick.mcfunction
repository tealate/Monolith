# Vanilla dimensions are explicitly visited so Nether/End parents and tracks also update.
execute in minecraft:overworld run function monolith:animation/tick
execute in minecraft:the_nether run function monolith:animation/tick
execute in minecraft:the_end run function monolith:animation/tick
