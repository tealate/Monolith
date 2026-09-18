# Animation Datapack API v1

Minecraft Java Edition **26.1 / data pack 101.1**。新しい汎用基盤は `monolith_anim:*`、利用例は `monolith:animation/demo/*` です。既存 `monolith:animation/*` は旧APIとして維持します。

## 最初に試す

開けた場所でプレイヤーとして実行します。

```mcfunction
/reload
/function monolith:animation/demo/hierarchy
# 再生中に被弾割り込み。Displayの演出を止め、Shake終了後に続きから再開
/function monolith:animation/demo/hit
```

| Demo function (`monolith:animation/demo/` 以下) | 内容 |
| --- | --- |
| `hierarchy` | BossRootのBezier/Arc移動 → OrbitRootの回転 → 2つのDisplayのXYZ回転・伸縮。Displayには別Sequenceの上下動も加算 |
| `player` | 同じ階層全体を、実行Playerのeyes / full_rotationへ追従 |
| `children` | MasterがEntranceをwaitし、完了後Part/Bobをparallelで開始 |
| `hit` | Priority 50の被弾Sequence。Displayの既存Sequenceと担当Layerをpause → 終了後resume |
| `hit_parallel` | 現在のAnimationを進めながらLayer 2の被弾Shakeを重ねる |
| `replace` | Priority 80で既存Sequenceを置換し、Recoverを開始 |
| `cancel` | 既存SequenceをCancelとして破棄し、Recoverを開始 |
| `reset` | この新デモのEntityだけ削除。残ったInstanceは次tickで回収 |

Hierarchyの通常演出は240tick。終了後の最終姿勢は残ります。再実行で作り直せます。リソースパックは変更していないため、今回必要な再読み込みは `/reload` です。

## 採用した構造

```text
Consumer tick.mcfunction / 任意function
              ↓ Public API
Sequence Definition ──→ Sequence Instance (Marker)
                            │ owner + 任意の担当slot
                            ↓
Transform Node: Base + Layer 0..3
   ├ Translation XYZ: 加算、軸ごと独立Tween / 1本のPath
   ├ Euler XYZ: 加算、軸ごと独立Tween
   └ Scale XYZ: 乗算、軸ごと独立Tween
              ↓
Local Quaternion → Parent World Quaternion × Local Quaternion
World Position = Parent Position + rotate(Parent Quaternion, Local Translation)
              ↓ 親から子へ depth 0..8
Marker.Pos / Display.Pos + transformation.left_rotation + scale
```

- EngineはDungeon・Monolithのデモを呼びません。物理的には既存 `datapack/` に同居させ、namespaceとロード/tick入口を分離しています。
- 各Nodeに固定4 Layer。空きslotを使うAPIもありますが、Sequenceでは担当slotを明示し、Pause/Cancelの範囲を確実にします。
- 各Layerは9軸独立。Translation/Eulerの加算順は不問、Scaleはslot順に固定小数点乗算します。各LayerのEulerを足してからLocal Quaternionへ変換します。Layer同士のQuaternion乗算ではありません。
- Eulerは**右手系・X→Y→Zの外因性回転**、`qLocal=qZ*qY*qX`。Parentは `qWorld=qParent*qLocal`。PlayerのYawはMinecraftの符号から変換します。
- Parent Scaleは継承しません。非均等Scaleと回転によるShearも発生させません。
- 毎tickはSequence → Layer更新/合成 → 親から子へのTransform確定。同じtickで更新された親の姿勢を子が使います。
- 静止したLocal回転・回転済みTranslationをキャッシュし、DisplayのNBTは変更時のみ更新します。外部ParentのAnchor追従は毎tick確認します。

## Nodeを作る

Marker、block_display、item_display、text_displayを対象にします。

```mcfunction
# 対象Entityを @s にして一度呼ぶ。重複呼び出しは状態を壊さない
function monolith_anim:node/init
# Local Base Transform。t=1000/block、r=1000/degree、s=1000/unit
function monolith_anim:node/base {tx:0,ty:1000,tz:0,rx:0,ry:0,rz:0,sx:1000,sy:1000,sz:1000}
```

`node/init` は実行Entityの位置と本体Yaw/PitchをRootの基準として取得します。Displayの既存 `transformation` を分解して取り込むAPIではありません。次のtickからBase/Layerが全Transformとbillboardを所有します。任意Quaternionを持つ既存Displayには、明示的にBaseを設定してください。NodeはEntity原点をPivotとし、ブロックの中心補正は自動では行いません。

`node/base` は9引数すべて必須。Parent無しのTranslationは登録時の位置からのワールド軸の変位です。Parent付きなら親座標系の変位です。Root自身の回転は、そのRootの移動方向を回転させません。

`node/remove` で登録とLayerを解除できます。Entityは削除せず、最終表示を残します。Sequenceは独立しているため、継続中のSequenceも止める場合はSequenceのCancelを先に実行してください。

## Layerの独立Tween

```mcfunction
function monolith_anim:layer/start {slot:0,property:"translation_x",from:0,to:3000,duration:60,easing:"out_quad"}
function monolith_anim:layer/start {slot:0,property:"translation_y",from:0,to:2000,duration:40,easing:"in_out_sine"}
function monolith_anim:layer/start {slot:0,property:"rotation_x",from:0,to:180000,duration:80,easing:"linear"}
function monolith_anim:layer/start {slot:0,property:"rotation_y",from:0,to:720000,duration:120,easing:"linear"}
function monolith_anim:layer/start {slot:0,property:"scale_y",from:1000,to:2000,duration:30,easing:"out_back"}
# 別Layerの浮遊を加算
function monolith_anim:layer/start {slot:1,property:"translation_y",from:0,to:500,duration:30,easing:"in_out_sine"}
```

Propertyは `translation_x/y/z`、`rotation_x/y/z`、`scale_x/y/z`、`scale_xyz`。`scale_xyz` は3軸へ同じTweenを開始します。同じslot・同じ軸だけ上書きし、他の軸は続行します。duration 0は即座に終点値になり、最終Entity適用は次のNode tickです。

```mcfunction
function monolith_anim:layer/pause {slot:0}
function monolith_anim:layer/resume {slot:0}
function monolith_anim:layer/cancel {slot:0}
function monolith_anim:layer/finish {slot:0}
function monolith_anim:layer/clear {slot:0}
```

Cancelは現在値で停止、Finishは稼働軸を終点へ、ClearはTranslation/Rotation=0、Scale=1に戻してslotを解放します。終了・Cancel済みでも最終値を合成するため、Clearまではslotを保持します。Pauseは担当slotの全軸とPathを止めます。

`layer/allocate` は空きslotを予約して `@s ml_l_slot` に返します（満杯は-1）。`layer/start_auto` は `slot` 以外が `layer/start` と同じで、空きslotに1つのPropertyを開始します。結果は `ml_l_ok`（成功1／拒否0）。複数軸を同じLayerへ入れる場合は取得したslotを再利用してください。定型Sequenceでは固定slotが簡潔です。

31 Easing: `linear` と Sine/Quad/Cubic/Quart/Quint/Expo/Circ/Back/Elastic/Bounceの `in_*` / `out_*` / `in_out_*`。Overshootは残します。

## PathもLayerのTranslation

```mcfunction
function monolith_anim:path/linear {slot:0,sx:0,sy:0,sz:0,ex:0,ey:2000,ez:4000,duration:60,easing:"out_quart"}
function monolith_anim:path/arc {slot:0,sx:0,sy:0,sz:0,ex:0,ey:0,ez:4000,height:2500,duration:60,easing:"linear"}
function monolith_anim:path/bezier {slot:0,sx:0,sy:0,sz:0,cx:3000,cy:4000,cz:2000,ex:0,ey:0,ez:4000,duration:60,easing:"in_out_sine"}
```

同じLayerのTranslation XYZをPathが所有します。Path開始はそのslotのTranslation軸Tweenを止めます。Translation軸Tweenを新たに開始するとPath全体を止め、他軸はその時点の値を保持します。Rotation・Scale・他Layerへは影響しません。

新APIのPathは一貫してNodeのLocal Translationです。Parent無しRootなら登録位置を基準としたワールド軸の変位になります。旧APIの絶対 `space:"world"` Pathは旧namespaceに維持しています。

## Parentと階層

```mcfunction
# Playerまたは親Nodeを選択
function monolith_anim:parent/select
# 直後に対象Childへbind
execute as @e[tag=my_child,limit=1] run function monolith_anim:parent/bind {mode:"full_rotation",anchor:"feet"}
```

親Nodeは先に `node/init` で登録します。Player等はNode登録せず `parent/select` でAnchorとして使います。選択→bindは同一次元・同じfunction内で続けて実行してください。Nodeは `ml_n_id` で識別され、ロード済みのEntityだけ解決します。

- Node親: `full_rotation` / `position_only`、`anchor:"feet"`。
- 外部Entity親: 上記に加えて `yaw`、`anchor:"eyes"`。姿勢に応じたeyes位置はMinecraftの実行コンテキストを使用。
- 最大depth 8（Root depth 0）。循環と、既存の子孫を含めた深さ超過はbind前に拒否。
- bindはLocal Base/Layerを保持して新しい親へ付けるので、見た目が移動します。
- `parent/unbind` は最後に解決したワールド位置・親回転を固定し、見た目を保って切り離します。Layerは続行。
- 親が見つからない間、そのNodeと子孫のTransform/Layerは停止し、最終姿勢を保持。親復帰後に再開します。Sequenceの時間は別管理です。
- 別次元の親への自動転送、チャンクの強制ロードはしません。

## 1 Sequence = 1 tick.mcfunction

定義登録、Instance再生、時刻functionを分離します。詳細な状態と制御APIは [SEQUENCER.md](SEQUENCER.md) を参照してください。

```mcfunction
# Consumerのload: 定義だけ登録（まだ再生しない）
function monolith_anim:sequence/define {id:"mypack:attack",definition:{tick:"mypack:attack/tick",duration:60,priority:10,slot:0}}

# 対象Nodeを @s にして新しいInstanceを再生
function monolith_anim:sequence/start {id:"mypack:attack"}
```

`data/mypack/function/attack/tick.mcfunction`:

```mcfunction
# --- 0t : Windup ---
execute if score @s ml_seq_time matches 0 run function monolith_anim:layer/start {slot:0,property:"rotation_z",from:0,to:-45000,duration:20,easing:"in_out_sine"}
# --- 20t : Attack ---
execute if score @s ml_seq_time matches 20 run function monolith_anim:path/arc {slot:0,sx:0,sy:0,sz:0,ex:0,ey:0,ez:4000,height:2000,duration:30,easing:"out_quad"}
execute if score @s ml_seq_time matches 20 run playsound minecraft:entity.player.attack.sweep master @a[distance=..24] ~ ~ ~ 1 1
# --- 50t : Impact / gameplay ---
execute if score @s ml_seq_time matches 50 run particle minecraft:crit ~ ~1 ~ 0.3 0.3 0.3 0.1 12 force
# ここから任意の mypack:boss/damage 等も呼べる
# --- 60t : Complete ---
execute if score @s ml_seq_time matches 60 run function monolith_anim:sequence/complete
```

実行者・位置はOwner。時刻はInstanceごとに0からdurationまで。利用側による加算は不要です。終了時刻までのイベントを実行後、自動Completeするため、最後の `sequence/complete` は省略できます。定義の再登録は将来のInstanceに反映され、既存Instanceのスナップショットは変えません。

子Sequenceは `sequence/child {id:"mypack:child",mode:"parallel|wait|replace"}`。外部イベントは対象Ownerで `sequence/interrupt {id:"mypack:hit",mode:"parallel|pause|cancel|replace"}`。Pause割り込みは停止対象と別slotを使います。Priorityの小さい外部割り込みは拒否されます。

## 他データパックからの利用と拡張点

別データパックから同じ `monolith_anim:*` APIを直接呼べます。利用側の定義登録functionを `data/monolith_anim/tags/function/definitions.json` の `values` へ追加すると、Engine初期化後に呼ばれます。`replace:true` は指定しません。

カスタム次元では、利用側functionに `execute in mypack:dimension run function monolith_anim:tick_dimension` を書き、そのfunctionを `data/monolith_anim/tags/function/dimensions.json` へ追加します。1次元につき1tickに1回だけ登録してください。Vanilla 3次元は標準登録済みです。

将来の物理分離時は `data/monolith_anim/` と `minecraft:load/tick` の該当エントリがEngine側の境界になります。今回コピー・別pack化は行いません。Easingの生成元は既存実装を再利用しますが、生成後のEngineには旧namespaceへの実行依存がありません。

## 数値範囲・運用上の制約

- Layer: Translation/Path座標・Arc heightは±1,000,000、Eulerは±3,600,000、Scaleは±8,000、durationは0..200,000。すべて整数、必須Macro引数は省略不可。
- Base: Translation ±1,000,000、Euler ±3,600,000、Scale ±8,000。
- Rootと外部Anchorの座標は各軸±1,000,000 block以内。ワールド境界全域を覆う64bit座標演算ではありません。
- Layer Scale合成は±32倍でClamp。Parent Scaleは継承せず、Node Base Scaleを最後に乗算します。
- 固定小数点の丸め、1度LUT補間の回転誤差があります。長いLocal Offsetほど回転誤差の位置への影響が増えます。
- Layer数4はAPIの契約です。暗黙の上書き回避のため満杯を通知し、完了Layerも勝手に再利用しません。
- InstanceはOwnerあたり64、ロード済み次元あたり256まで。これは容量上限であり、20TPSを保証する数ではありません。
- 稼働する軸数・Path・Node数・外部Anchor数で負荷が増えます。深さpassとID付きセレクタにも走査コストがあります。実サーバーの時間計測やTPS保証はしていません。大量導入時はサーバーで測定してください。
- Node/Owner/Instanceはロード範囲内が前提。チャンクをまたぐ大規模移動、次元移動、Owner消失は [SEQUENCER.md](SEQUENCER.md) のライフサイクル制約も確認してください。
- 旧APIと新Nodeが同じDisplayのTransformを同時所有することは拒否します。旧APIの回転Yの符号や絶対world Pathの意味を新APIへ暗黙変換しません。
- Playback Rate、組み込みLoop、Cubic Bezier、ScaleのParent継承、任意Quaternion入力/SLERP Track、無制限階層は未実装です。反復演出はSequence内の通常functionで記述できます。

## 再生成と検証

```powershell
node tools/build-animation.mjs
node tools/test-animation.mjs
node tools/test-transform.mjs
git diff --check
```

生成元は `tools/build-animation-{layers,nodes,sequence,debug}.mjs`。Nodeの数値テスト、Layerの生成コマンド実行テスト、Sequence状態テスト、既存Transform回帰テストを分けています。オフライン実行器はMinecraftパーサやクライアント描画を代替しません。AGENTS.mdの方針に従いMinecraft/サーバーは起動していません。コマンド読込、実際の時刻・Entity移動・描画・高負荷時のTPSはユーザー側の確認事項です。
