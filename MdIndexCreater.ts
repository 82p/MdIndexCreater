/**
 * Headword
 */
class Headword {
	private sharpCount: number;
	private headword: string;
	private headwordNumber: number;
	static headwordCount: number = 0;
	public static HEADWORD_TARGET_TAG = '<a class="headword" name ="';
	public static HEADWORD_LINKED_TAG = '<a class="linkedText" href ="#';
	/**
	 * コンストラクターです。
	 */
	constructor(sharpCount, str) {
		this.sharpCount = sharpCount;
		this.headword = str.replace(/^#+\s+/g, "");
		Headword.headwordCount++;
		this.headwordNumber = Headword.headwordCount;
	}

	/**
* 文字列を検査し見出しであればheadwordのインスタンスを生成し返す。 それ以外であればnullを返す
*
* @param line
* @return
*/
	public static getHeadword(line) {
		if (line.match(/^#+\s+.*/g)) {
			var sharp: string = line.match(/^#+/);
			return new Headword(sharp[0].length, line);
		}
		return null;
	}
	/**
* 見出しを目次に変換して返す
* @return
*/
	public getHeadline() {
		var sb = "";
		if (this.headwordNumber !== 1) {
			for (var i = 1; i < this.sharpCount; i++) {
				sb += "  ";
			}
		}
		sb += "* [" + this.headword + "](#" + this.headwordNumber + "_" + this.headword + ")";
		return sb;
	}

	/**
	 * 見出しをタグがついたテキストに変換して返す
	 * @return
	 */
	public getTaggedText() {
		var sb = "";
		sb += Headword.HEADWORD_TARGET_TAG;
		sb += this.headwordNumber;
		sb += "_";
		sb += this.headword;
		sb += "\"></a>";
		return sb;
	}
	/**
	 * リンクがついたテキストを返します。
	 * 本文中で使うテキストです。
	 */
	public getLinkedText() {
		var sb = Headword.HEADWORD_LINKED_TAG;
		sb += this.headwordNumber;
		sb += "_";
		sb += this.headword;
		sb += '">' + this.headword;
		sb += '</a>';
		return sb;
	}
	/**
	 * 見出しをシャープを除いて返す
	 * @return
	 */
	public getHeadword() {
		return this.headword;
	}
    /**
     * sharpの数を返す
     */
	public getSharpCount() {
		return this.sharpCount;
	}
	/**
	 * 見出し番号を返す
	 */
	public getHeadwordNumber() {
		return this.headwordNumber;
	}
	/**
	 * 見出しがいくつ生成されたかを返す
	 * @return
	 */
	public static getHeadwordCount() {
		return Headword.headwordCount;
	}
	private static addHeadwordCount() {
		Headword.headwordCount++;
	}
}

class TextConverter {
	/**
	 * 目次開始タグ
	 */
	public static HEADLINE_START_TAG = '<a name="mokuji_headline"></a>';
	/**
	 * 目次終了タグ
	 */
	public static HEADLINE_END_TAG = '<a name="mokuji_headline_end"></a>'
	/**
	 * Topへ戻るボタン
	 */
	public static TO_TOP_BUTTON: string = '<div class="to_top" style="text-align:right;">[TOPへ](#mokuji_headline)</div>';
	/**
	 * 目次のテキストデータ
	 */
	private headline: string[] = [];
	/**
	 * 目次用HTMLタグを付加した本文
	 */
	private taggedText: string[] = [];
	/**
	 * 変換後のテキストデータ
	 */
	private textArrayText: string[] = [];
	/**
	 * コメントアウトの識別子
	 */
	private COMMENT_OUT_MARKS = ["```", "~~~"];
	/**
	 *	コメントアウト時の識別子を保持する文字列
	 */
	private comment: RegExp = null;
	/**
	 * 目次の挿入位置
	 */
	private lineCountInsertedHeadline = 0;
	/**
	 * 見出しリスト
	 */
	private headwordList: Headword[] = [];
	/**
	 *	与えられた文字列のリストを先頭から解析し、見出しがある場合、目次に変換しタグ付けし変換する。
	 * @param beforeText		変換前の文字列リスト
	 * @param maxSharpCount	判定する見出しレベル（＃の数）
	 * @param ignoreFirstNumber	先頭から数えて変換除外する行数
	 * @param ignoreLastNumber	最終行から数えて変換除外する行数
	 */
	// public constructor(beforeText, maxSharpCount, ignoreFirstNumber, ignoreLastNumber) {
	public constructor(beforeText, maxSharpCount) {
		var textSize = beforeText.length;
		for (var i = 0; i < beforeText.length; i++) {
			var line: string = beforeText[i];
			// 無視する行か判定
			// if (i+1 <= ignoreFirstNumber || (textSize - ignoreLastNumber) < i+1) {
			// 	this.taggedText.push(line);
			// 	continue;
			// }
			// コメントアウトかどうかチェック
			if (!this.isCommentOut(line)) {
				this.checkIsHeadword(line, maxSharpCount);
			}
			this.taggedText.push(line);
		}
		if (this.headline.length > 1) {
			this.headline.push(TextConverter.HEADLINE_END_TAG)
			this.headline.push(""); // 目次の後に改行を挿入
		}
		this.textArrayText = this.headline.concat(this.taggedText);
	}

	/**
	 * lineからHeadwordを作成し、nullでなければ変換を行う
	 * @param line 元のテキスト1行
	 * @param maxSharpCount 変換対象の見出しレベル（＃の数）
	 */
	private checkIsHeadword(line, maxSharpCount) {
		var headword = Headword.getHeadword(line);
		if (headword != null) {
			if (headword.getSharpCount() <= maxSharpCount) {
				this.headwordList.push(headword);
				if (headword.getHeadwordNumber() == 1) {
					this.lineCountInsertedHeadline = this.taggedText.length;
					this.headline.push(TextConverter.HEADLINE_START_TAG);
				}
				this.headline.push(headword.getHeadline());
				this.taggedText.push("");
				this.taggedText.push(TextConverter.TO_TOP_BUTTON);
				this.taggedText.push("");
				this.taggedText.push(headword.getTaggedText());
			}
		}
	}

	/**
	 * 変換したtextを返す
	 *
	 * @return ArrayList<String> 変換したtext
	 */
	public gettextArrayText() {
		return this.textArrayText;
	}
	/**
	 * 変換してtextをstringに変換してかえす
	 */
	public gettextArrayTextToString() {
		var str: string;
		for (var i = 0; i < this.textArrayText.length; i++) {
			str += this.textArrayText[i];
			str += "\n"
		}
		return str;
	}

	/**
	 * コメントアウト中かチェック
	 * @param line
	 * @return
	 */
	private isCommentOut(line) {
		if (this.comment == null) {
			for (var i = 0; i < this.COMMENT_OUT_MARKS.length; i++) {
				var regexp = new RegExp("^" + this.COMMENT_OUT_MARKS[i] + '(.*)');
				if (line.match(regexp)) {
					this.comment = regexp;
					return true;
				}
			}
			return false;
		} else {
			//コメントアウト中
			//識別子が等しければnullに戻してコメントアウト終了
			if (line.match(this.comment)) {
				this.comment = null;
				return false;
			}
			return true;
		}
	}
	/**
	 * Headwordのリストを返す
	 */
	public getHeadwordList() {
		return this.headwordList;
	}
	/**
	 * タグ付きの本文を返す
	 */
	public getTaggedText() {
		return this.taggedText;
	}
	/**
	 * もくじを返す
	 */
	public getHeadline() {
		return this.headline;
	}
}

class TextReader {
    /**
     * 読み込んだテキストデータです。
     */
	private text: string;
    /**
     *  テキストデータの配列です
     */
	private textArray: string[];
    /**
     * 改行コードです。
     */
	public static lineSeparater: string;
    /**
     * コンストラクターです。
     */
	public constructor(textArea) {
		if (textArea !== null) {
			this.text = textArea.value;
			this.findLineSeparater();
			// TextReader.lineSeparater ="\n";
			if (TextReader.lineSeparater == null) {
				return null;
			}
			this.convertToArray();
			return this;
		}
		return null;
	}
    /**
     * テキストを配列に変換します。
     */
	public convertToArray() {
		this.textArray = this.text.split(TextReader.lineSeparater);;
	}
    /**
     * 改行コードを検索します。
     */
	public findLineSeparater() {
		if (this.text.match(/\n\r/)) {
			TextReader.lineSeparater = "\n\r";
			return;
		}
		if (this.text.match(/\n/)) {
			TextReader.lineSeparater = "\n";
			return;
		}
		var r = this.text.match(/\r/);
		if (r !== null) {
			TextReader.lineSeparater = "\r";
			return;
		}
	}
	public getLineSeparater() {
		return TextReader.lineSeparater;
	}
	public getTextArray() {
		return this.textArray;
	}
}
/**
 * TextAnalyser
 */
class TextAnalyser {
	private textArray: string[];
	constructor(textData: string[]) {
		this.textArray = textData;
	}
	public getMarkText(headwordList: Headword[], hIndex) {
		for (var i = 0; i < this.textArray.length; i++) {
			var line = this.textArray[i];
			var tagmaccher = RegExp(Headword.HEADWORD_TARGET_TAG, `i`)
			if (line.match(/^#+\s+.*/) === null && line.match(tagmaccher) === null) {
				for (var j = 0; j < headwordList.length; j++) {
					var headword = headwordList[j];
					var reg = RegExp(headword.getHeadword(), 'g');
					if (line.match(reg)) {
						this.textArray[i] = line.replace(reg, headword.getLinkedText());
					}
				}
			}

		}
		return this.textArray;
	}
}
/**
 * TextArea
 */
class TextArea {
	private text: string;
	private textArea;
	constructor(textArea) {
		this.textArea = textArea;
		this.text = textArea.value;
	}
	public getText() {
		return this.text;
	}
	public getTextArea() {
		return this.textArea;
	}
	public setTextArea(text: string) {
		this.textArea.value = text;
	}
	public reset() {
		this.textArea.value = this.text;
	}
}

function main(h: number, markedh: number) {
	var active_element = document.activeElement;
	var tagname = "editor";
	var target = null;
	if (active_element.tagName === "TEXTAREA" || active_element.tagName === "textarea") {
		target = active_element;
	} else {
		target = document.getElementById("editor");
	}
	if (target === null) {
		alert("変換対象が見つかりません\nテキストエリアを選択するか\nIDがeditorのテキストエリアが存在するページで実行してください");
		return;
	}
	var textArea = new TextArea(target);
	var textReader = new TextReader(textArea.getTextArea());
	var textArray: string[] = textReader.getTextArray();
	var outputArray: string[];
	var headlineStart: number = textArray.indexOf(TextConverter.HEADLINE_START_TAG);
	if (headlineStart !== -1) {
		//目次終了タグを検知
		var headlineEnd = textArray.indexOf(TextConverter.HEADLINE_END_TAG);
		if (headlineEnd === -1) {
			alert('目次の終了タグ\n\n' + TextConverter.HEADLINE_END_TAG + '\n\nが見つかりません\n\n目次終了タグを挿入してください');
			return;
		}
		if (headlineEnd - headlineStart < 1 || headlineEnd > textArray.length) {
			alert('目次の終了タグ\n\n' + TextConverter.HEADLINE_END_TAG + '\n\nの位置が不正です\n\n正しい場所に挿入してください');
			return;
		}
		//目次とその後の空白を削除
		textArray.splice(headlineStart, headlineEnd - headlineStart + 1);
		while (textArray[0] === "") {
			textArray.splice(0, 1);
		}
		//見出しのリンク元とリンク先を削除
		var targetReg = RegExp("^" + Headword.HEADWORD_TARGET_TAG + ".*");
		textArray = textArray.filter(function (value) { return value.match(targetReg) === null });
		var headwordReg = RegExp(Headword.HEADWORD_LINKED_TAG + ".*?>(.*?)</a>", "g");
		textArray = textArray.map(function (value, index, arr) {
			if (value.match(headwordReg)) {
				return value.replace(headwordReg, "$1");
			} else {
				return value;
			}
		})
		var index = textArray.indexOf(TextConverter.TO_TOP_BUTTON);
		while (index != -1) {
			textArray.splice(index, 1);
			if (textArray[index] === "") {
				textArray.splice(index, 1);
			}
			if (textArray[index - 1] === "") {
				textArray.splice(index - 1, 1);
			}
			index = textArray.indexOf(TextConverter.TO_TOP_BUTTON)
		}
		outputArray = textArray;
	} else {
		var textConverter = new TextConverter(textReader.getTextArray(), h);
		var headline = textConverter.getHeadline();
		var taggedText = textConverter.getTaggedText();
		//目次を入れるか
		if (0 < markedh && markedh < 7) {
			var textAnalyser = new TextAnalyser(taggedText);
			var main = textAnalyser.getMarkText(textConverter.getHeadwordList(), markedh);
			outputArray = headline.concat(main);
		} else {
			outputArray = textConverter.gettextArrayText();
		}
	}
	textArea.setTextArea(outputArray.join(TextReader.lineSeparater));
	if (textArea.getTextArea().id === "editor") {
		var doPreview = doPreview || null;
		if (doPreview != null) {
			doPreview();
		}
	}
}
main(6, 6);