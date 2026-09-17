# AGENTS.md

## Project

このリポジトリは Minecraft Java Edition 26.1 用リソースパック **Monolith** の開発環境です。

仕様・設計・決定事項については、以下の Notion を参照してください。

Notion:
`https://app.notion.com/p/3dd1fd1a6151819597c5c72cd34b8e22`

実装方法や仕様が不明な場合は、自己判断で大きな仕様を追加・変更する前に、まず既存ファイルと Notion の内容を確認してください。

---

## Minecraft Version

対象バージョン:

`Minecraft Java Edition 26.1`

コマンド、JSON、リソースパック形式などは、このバージョンで利用可能な仕様に合わせて実装してください。

古いバージョンや別バージョンの形式をそのまま使用しないでください。

---

## Resource Pack Root

この Git リポジトリのルートは、そのまま Minecraft が使用する実際のリソースパックルートです。

基本構成:

```text
Monolith/
├─ pack.mcmeta
├─ assets/
│  └─ monolith/
├─ vanilla_reference/
│  └─ assets/
│     └─ minecraft/
├─ AGENTS.md
└─ .git/
```

`pack.mcmeta` と `assets/` はリポジトリ直下に配置します。

ユーザー指定により、データパックは専用の `datapack/` 以下へ配置します。
`MonolithTest/datapacks/Monolith` のJunctionからこのフォルダを参照します。
データパック実装のAPI・制約は `datapack/TRANSFORM.md` を参照してください。
`tools/build-transform.mjs` と `tools/build-transform-debug.mjs` が生成するFunctionは生成元を編集し、再生成します。
変更後は `node tools/test-transform.mjs` で数値・状態の回帰検証を実行してください。

別途リソースパック用のフォルダを作成しないでください。

以下のような入れ子構造は作成しないでください。

```text
Monolith/
└─ another_resource_pack/
   ├─ pack.mcmeta
   └─ assets/
```

変更内容はこのリポジトリ内の実ファイルへ直接反映してください。

ビルド用・出力用のコピーは、明示的に要求された場合を除いて作成しないでください。

---

## Namespace

このプロジェクトの namespace は以下を使用します。

`monolith`

新規リソースは原則として以下の namespace 配下へ作成してください。

```text
assets/monolith/
```

resource location の例:

```text
monolith:item/example
monolith:block/example
monolith:entity/example
```

既存の `minecraft` namespace を直接上書きする必要がある場合は、その必要性を確認してから変更してください。

---

## Vanilla Reference

`vanilla_reference/` には、Minecraft 26.1 のバニラリソースを参照用として配置しています。

主な構成:

```text
vanilla_reference/
└─ assets/
   └─ minecraft/
```

このディレクトリは実装時の参考資料です。

バニラの以下のような内容を確認するために使用してください。

* JSON の構造
* モデル定義
* テクスチャ
* blockstate
* item 定義
* shader
* その他のバニラリソース

必要に応じて、バニラのファイルを参考・流用して実装して構いません。

ただし、`vanilla_reference/` 自体はリソースパックの成果物ではありません。

Minecraft から参照されることを前提にした実装をしないでください。

このディレクトリは最終的に削除する可能性があります。

バニラファイルを実際の実装で必要とする場合は、適切な場所へコピー・変更した上で使用してください。

---

## Editing Rules

既存の構成や実装がある場合は、まずそれを確認してから編集してください。

以下を基本方針とします。

* 既存の命名規則をできるだけ維持する
* 不要なフォルダ階層を追加しない
* 不要なファイルコピーを作らない
* 必要のない既存ファイルの移動・改名・削除をしない
* 小さな変更で済む場合は大規模な書き換えを避ける
* 同様の実装が既に存在する場合は可能な限り再利用する
* `vanilla_reference/` は参照用として扱う

構造そのものを大きく変更する必要がある場合は、変更理由を作業結果に記載してください。

---

## Git Rules

このリポジトリでは、Codex は Git を作業管理のために自由に使用して構いません。

必要に応じて以下を行って構いません。

* 新しいブランチの作成
* ブランチの切り替え
* コミット
* push
* stash
* stash の復元
* 一時的な作業ブランチの作成
* 既存のローカル差分を退避するためのコミット
* 既存のローカル差分を別ブランチへ保存

作業開始時に未コミットの差分が存在する場合、それらはユーザーによる変更である可能性があります。

ただし、作業を安全に進めるためであれば、それらをそのまま保持することに固執する必要はありません。

必要に応じて以下のような方法で安全に保存してください。

```text
stash
```

または、

```text
一時ブランチを作成
↓
既存差分をコミット
↓
作業ブランチへ戻る
```

既存差分を保護することを優先し、内容を失わないようにしてください。

ユーザーの既存変更と今回の作業内容を分離できる場合は、分離して管理することを推奨します。

Git 操作について毎回ユーザーへ確認を求める必要はありません。

ただし、以下のような破壊的操作は避けてください。

* 未保存変更を失う `git reset --hard`
* 意図しない変更を消す `git checkout -- <file>`
* 未追跡ファイルを無条件に削除する `git clean -fd`
* 既存の共有履歴を書き換える force push
* ユーザーの変更を確認せず破棄する操作

どうしても履歴の書き換えや変更破棄が必要な場合は、その理由を明確にしてください。

作業完了時には、実施した Git 操作も簡潔に報告してください。

例:

* 作成したブランチ
* 作成したコミット
* push の有無
* stash の使用有無
* 既存差分をどこへ退避したか

---

## Reload / Testing

このフォルダは Minecraft が実際に参照しているリソースパックです。

リソースパックの変更は Minecraft 上で以下を使用して再読み込みできます。

```text
F3 + T
```

データパック側の変更を再読み込みする場合は、

```text
/reload
```

を使用します。

`F3 + T` と `/reload` は用途が異なるため混同しないでください。

Codex 自身が Minecraft 上で確認していない場合は、「ゲーム内で動作確認済み」とは報告しないでください。

---

## Before Finishing

作業完了前に最低限以下を確認してください。

* JSON の構文が壊れていないか
* resource location が正しいか
* namespace が意図せず `minecraft` などになっていないか
* ファイルパスが Minecraft 26.1 の形式に合っているか
* 既存ファイルへの参照を壊していないか
* 不要な入れ子のリソースパックを作っていないか

作業完了時には簡潔に以下を報告してください。

* 変更したファイル
* 実装した内容
* Minecraft 上での確認方法
* 実施した Git 操作
* 未確認事項や注意点がある場合はその内容
