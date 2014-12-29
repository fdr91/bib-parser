package ru.spbstu.icc.kspt.bibparser.cli;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.FileReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.Reader;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.jbibtex.BibTeXDatabase;
import org.jbibtex.BibTeXEntry;
import org.jbibtex.BibTeXParser;
import org.jbibtex.Key;
import org.jbibtex.ParseException;
import org.jbibtex.Value;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.regex.Pattern;

import ru.spbstu.icc.kspt.bibparser.style.Styler;

enum Option {
	M, BIB, ST, OP, IDS, P, OUT, R, F, H
}

enum ModeOptions {
	INTERACTIVE, COMMAND
}

enum Operation {
	TO_HTML, SHOW_IDS, GREP, PRINT
}

enum Stage {
	MAIN, ZERO, LITER, TAGS, GREP, PRINT, PATTERN, SELECT_TAGS
, SELECT_TAGS_1, SELECT_STYLE}

public class CliMainClass {

	void printHlp(){
		System.out.println("Вы пользуетесь бета-версией CLI-интерфейса приложения для создания списков литературы для научных публикаций\n"
				+ "\tapp.jar [-bib <path to .bib>] [gui] [-op to_html|show_ids|grep|print] [-st <path to .xml style> [-m  interactive|command] [-r] [-f <field name> -ids <id1, id2...>] [-h]\n"
				+ "Параметры:\n"
				+ "\t\t-gui — запустить GUI\n"
				+ "\t\t-bib — путь к bib-файлу.\n"
				+ "\t\t-op — операция: \n"
				+ "\t\t\tto_html — сформировать список. Должны быть так же указаны -bib, -out, -st, -ids\n"
				+ "\t\t\tshow_ids — показать все существующие id в bib\n"
				+ "\t\t\tgrep — вывести записи для клоторых поле, указанное в параметре -f соответствует регулярному выражению, указаному в -p. Если -f не указан, то фильтрация выполняется по id\n"
				+ "\t\t\tprint — вывод всех записей из bib в консоль\n"
				+ "\t\t-st — путь к xml-файлу стиля\n"
				+ "\t\t-m — интерактивный или обычный (по умолчанию) режим работы: interactive | command\n"
				+ "\t\t-out — путь к выходному файлу. Применяется только для операции to_html\n"
				+ "\t\t-r — перезаписать указанный в -out файл, если он уже существует\n"
				+ "\t\t-f — поле для -op grep\n"
				+ "\t\t-ids — идентификаторы для операции to_html\n"
				+ "\t\t-h — показать это сообщение\n\n"
				+ "Примеры:\n"
				+ "\tapp -bib database.bib -out output.html -s style.xml -ids id1,id2\n\t\tСформировать список в формате HTML. "
				+ "Взять теги id1,id2 из файла database.bib и отформатировать в соответствии с style.xml. "
				+ "Результат записать в out.html\n\n"
				+ "\tapp -op print -bib database.bib\n"
				+ "\t\tВывести на экран все записи из database.bib\n\n"
				+ "\tapp -op grep -bib database.bib -p rfc.*\n"
				+ "\t\tВывести на экран записи из database.bib, теги которых подходят под патерн \"rfc.*\"\n\n"
				+ "\tapp -op grep -f author -p .*Lenin.* -bib database.bib\n"
				+ "\t\tВывести на экран записи из database.bib, поле author которых подходит под патерн \".*Lenin.*\"\n\n"
				+ "\tapp -op show_ids -bib database.bib\n"
				+ "\t\tВывести все id из database.bib\n");
	}

	private final static Logger logger = LoggerFactory
			.getLogger(CliMainClass.class);

	void runInteractive() throws Exception {
		BufferedReader br = new BufferedReader(
				new InputStreamReader(System.in));
		logger.debug("Run interactive mode");
		Pattern pattern = Pattern.compile("\\d");
		stage = Stage.ZERO;
		while (true) {
			switch (stage) {
			case ZERO:
				while(bibushka==null){
					System.out.print("Укажите путь к BIB-файлу>");
					String str = br.readLine();
					File tmp=null;
					if(!str.equals("") && str.length()>0)
						tmp = new File (str);
					if(tmp.exists())
						bibushka = tmp;
					else
						System.out.print("Файл не существует\n");
				}
				stage = Stage.MAIN;
				break;
			case MAIN:
				System.out.print("\tВыберите желаемую операцию\n"
						+ "\t\t1. Создать список литературы в виде HTML\n"
						+ "\t\t2. Вывести все доступные теги\n"
						+ "\t\t3. Фильтрованный вывод записей\n"
						+ "\t\t4. Вывод всех записей базы\n"
						+ "\t\t0. Назад\n\n");
				int k=-1; 
				while(k==-1){
					System.out.print("Введите номер>");
					String str = br.readLine();
					if(pattern.matcher(str).matches()){
						k=Integer.parseInt(str);
						switch(k){
						case 1: stage=Stage.LITER; break;
						case 2: stage=Stage.TAGS; break;
						case 3: stage=Stage.GREP; break;
						case 4: stage=Stage.PRINT; break;
						case 0: stage=Stage.ZERO; break;
						default: System.out.print("Номер указан не верно\n"); k=-1;
						}
					}
				}
				break;
			case LITER:
				File tmp=null;
				System.out.print("\t0. Назад\nВыберите файл для вывода>");
				String str1 = br.readLine();
				if(str1.matches("0"))
					stage=Stage.MAIN;
				else {
					this.resultushka = new File(str1);
					if(!resultushka.exists())
						stage=Stage.SELECT_TAGS;
					while (resultushka.exists()&&!rewrite) {
						System.out.println(String
								.format("\t0. Назад\nFile %s exists. Would you like to replace it?[y/n]>",
										resultushka.getAbsolutePath()));
						String line = "";
						while (!line.equals("y") && !line.equals("n"))
							line = br.readLine();
						if (line.equals("y")) {
							rewrite = true;
							stage=Stage.SELECT_TAGS;
						} else if(line.equals("n")){
							System.out.print("Please specify new file>");
							line = br.readLine();
							resultushka = new File(line);
							//stage = Stage.SELECT_TAGS;
						} else if(line.equals("0")) {
							stage=Stage.MAIN;
							break;
						}
					}
				}
				
				break;
			case SELECT_TAGS:
				field=null;
				System.out.print("\t1. Пропустить\n\t0. Назад\nВведите регулярное выражение>");
				String str3=br.readLine();
				if(str3.matches("0"))
					stage=Stage.LITER;
				else if(str3.equals("1")){
					stage=Stage.SELECT_TAGS_1;
				} else {
					this.patternushka = str3;
					grepBib();
				}
				break;
			case SELECT_TAGS_1:
				System.out.print("Введите теги через запятую>");
				String str4=br.readLine();
				this.ids=str4.split(",");
				stage=Stage.SELECT_STYLE;
				break;
			case SELECT_STYLE:
				System.out.print("\t0. Назад\nВведите путь к файлу стиля>");
				String str5=br.readLine();
				this.styleushka = new File(str5);
				if(styleushka.exists()) {
					process();
					System.out.println(String.format("Список сгенерирован.\nРезультат нахоидтся в файлe %s", resultushka));
					stage=Stage.MAIN;
				} else{
					System.out.println(String.format("Файл %s не существует", styleushka.getAbsolutePath()));
				}
				break;
			case TAGS: printIds(); stage=Stage.MAIN; break;
			case GREP: 
				System.out.print("\tВведите поле для осуществления фильтрации:\n");
				String[] arr = printFormatedFields();
				System.out.print("\t\t0. Назад\n");
				int u=-1;
				String str=null;
				while(u==-1 || u>arr.length){
					System.out.print("Введите номер>");
					if((str=br.readLine()).matches("\\d+"))
						u=Integer.parseInt(str);
				} 
				if(u==0) {
					stage=Stage.MAIN;
				} else {
					this.field = arr[u-1];
					stage=Stage.PATTERN;
				}
				break;
			case PRINT: grepBib(); stage=Stage.MAIN; break;
			case PATTERN:
				System.out.print("\t0. Назад\nВведите регулярное выражение>");
				String regEx=null;
				str=br.readLine();
				if(str.matches("0"))
					stage=Stage.GREP;
				else {
					this.patternushka = str;
					grepBib();
					stage=Stage.MAIN;
				}
				break;
			default:
				throw new Exception("Uncostistant state");
			}
		}
	}
	
	String[] printFormatedFields() throws FileNotFoundException, IOException, ParseException{
		Map<Key, BibTeXEntry> entries=null;
		try (Reader reader = new FileReader(bibushka);) {
			BibTeXParser bibtexParser = new org.jbibtex.BibTeXParser();
			BibTeXDatabase database = bibtexParser.parse(reader);
			entries = database.getEntries();
		}
		int k=100;
		Set<String> set = new HashSet();
		for(Key key : entries.keySet()){
			Set<Key> ks = entries.get(key).getFields().keySet();
			for(Key kk : ks)
				set.add(kk.toString());
			k++;
			if(k==0)
				break;
		}
		String[] arr = new String[set.size()];//(String[])set.toArray();
		Object[] sOb = set.toArray();
		for(int i =0; i< set.size(); i++)
			arr[i] = (String)sOb[i];
		k=0;
		for(String s : arr){
			System.out.println(String.format("\t\t%3d. %s", ++k,s));
		}
		return arr;
	}
	
	// Args
	boolean interactive_mode = false; // true — interactive, false — cli
	File bibushka; // Bib-file
	File styleushka;// Style-file

	File resultushka;// were results will be
	String[] ids; // tags to get from bib
	Operation operation;// = Operation.TO_HTML;
	boolean rewrite = false;
	String field;// = "!tag";
	String patternushka;// = null;
	Stage stage;
	private boolean showHelp;

	CliMainClass() {
		bibushka = null; // Bib-file
		styleushka = null;// Style-file
		resultushka = null;// were results will be
		ids = null; // tags to get from bib
		operation = null;// = Operation.TO_HTML;
		field = null;
		patternushka = null;
		showHelp = false;
	}

	public void run(String[] args) {
		logger.debug("Start");
		try {
			parseArgs(args);
			if(showHelp){
				printHlp();
			} else {
				if (interactive_mode)
					runInteractive();
				else
					runCommand();
			}

		} catch (java.lang.IllegalArgumentException e) {
			System.err.println(e.getMessage());
		} catch (FileNotFoundException e) {
			System.err.println(e.getMessage());
		} catch (Exception e) {
			System.err.println(e.getMessage());
			e.printStackTrace(System.err);
		}
		logger.debug("End");
	}

	void parseArgs(String[] args) throws java.lang.IllegalArgumentException,
			IOException {
		Option curr;
		String arg1 = null;
		try {
			for (int i = 0; i < args.length; i++) {
				arg1 = args[i];
				String arg = arg1.toUpperCase().substring(1);
				curr = Option.valueOf(arg);
				switch (curr) {
				case H:
					this.showHelp = true;
					break;
				case M:
					logger.debug(String.format("\"%s %s\" passed", args[i],
							args[i + 1]));
					i++;
					ModeOptions mo = ModeOptions.valueOf(args[i].toUpperCase());
					switch (mo) {
					case COMMAND:
						interactive_mode = false;
						break;
					case INTERACTIVE:
						interactive_mode = true;
						break;
					}
					break;

				case BIB:
					logger.debug(String.format("\"%s %s\" passed", args[i],
							args[i + 1]));
					i++;
					this.bibushka = new File(args[i]);
					if (!bibushka.exists())
						throw new java.io.FileNotFoundException(String.format(
								"File %s not found", bibushka));
					break;

				case ST:
					if (styleushka != null)
						throw new java.lang.IllegalArgumentException(
								String.format(
										"Argument ST already defined. Previous var is %s",
										styleushka));
					logger.debug(String.format("\"%s %s\" passed", args[i],
							args[i + 1]));
					i++;
					styleushka = new File(args[i]);
					if (!styleushka.exists())
						throw new java.io.FileNotFoundException(String.format(
								"File %s not found", styleushka));
					break;
				case OP:
					if (operation != null)
						throw new java.lang.IllegalArgumentException(
								String.format(
										"Argument OP already defined. Previous var is %s",
										operation.toString()));

					logger.debug(String.format("\"%s %s\" passed", args[i],
							args[i + 1]));
					i++;
					operation = Operation.valueOf(args[i].toUpperCase());
					break;
				case IDS:
					if (ids != null) {
						String tmp = "";
						for (String id : ids)
							tmp += id + ",";
						throw new java.lang.IllegalArgumentException(
								String.format(
										"Argument IDS is already defined. Previous var is %s",
										tmp));
					}

					logger.debug(String.format("\"%s %s\" passed", args[i],
							args[i + 1]));
					i++;
					ids = args[i].split(",");
					break;
				case P:
					if (patternushka != null)
						throw new java.lang.IllegalArgumentException(
								String.format(
										"Argument P is already defined. Previous var is %s",
										patternushka));
					logger.debug(String.format("\"%s %s\" passed", args[i],
							args[i + 1]));

					i++;
					patternushka = args[i];
					break;
				case OUT:
					if (resultushka != null)
						throw new java.lang.IllegalArgumentException(
								String.format(
										"Argument OUT is already defined. Previous var is %s",
										resultushka.getAbsoluteFile()));
					logger.debug(String.format("\"%s %s\" passed", args[i],
							args[i + 1]));
					i++;
					this.resultushka = new File(args[i]);
					break;
				case R:
					logger.debug(String.format("\"%s\" passed", args[i]));
					this.rewrite = true;
					break;
				case F:
					if (field != null)
						throw new java.lang.IllegalArgumentException(
								String.format(
										"Argument F is already defined. Previous var is %s",
										resultushka.getAbsoluteFile()));
					logger.debug(String.format("\"%s %s\" passed", args[i],
							args[i + 1]));
					i++;
					field = args[i];
					break;
				}
			}
		} catch (java.lang.IllegalArgumentException e) {
			java.lang.IllegalArgumentException ex = new java.lang.IllegalArgumentException(
					String.format("Illegal argument passed: %s", arg1));
			throw ex;
		}
	}

	void runCommand() throws Exception {
		logger.debug("Run command mode");
		if (operation == null)
			operation = Operation.TO_HTML;
		switch (operation) {
		case GREP:
			if (bibushka != null && bibushka.exists() && this.ids == null
					&& this.resultushka == null && this.styleushka == null) {

				logger.debug(String
						.format("Grep bib operation\n\tParameters are:\n\t\tBIB-file:\t%s\n\t\tField:\t\t%s\n\t\tPattern:\t%s",
								bibushka, field, patternushka));
				grepBib();
			} else {
				throw new java.lang.IllegalArgumentException(
						"Wrong set of the arguments");
			}
			break;
		case SHOW_IDS:
			if (bibushka != null && bibushka.exists() && this.ids == null
					&& this.resultushka == null && this.styleushka == null
					&& this.field == null && this.patternushka == null) {
				logger.info("Print all IDS");
				printIds();
			} else {
				throw new java.lang.IllegalArgumentException(
						"Wrong set of the arguments");
			}
			break;
		case TO_HTML:
			if (ids != null && ids.length != 0 && bibushka != null
					&& resultushka != null && styleushka != null) {

				while (resultushka.exists() && !rewrite) {
					logger.info(String
							.format("File %s exists. Would you like to replace it?[y/n]",
									resultushka.getAbsolutePath()));
					System.out.print(">");
					BufferedReader br = new BufferedReader(
							new InputStreamReader(System.in));
					String line = "";
					while (!line.equals("y") && !line.equals("n"))
						line = br.readLine();
					if (line.equals("y")) {
						rewrite = true;
					} else {
						logger.info("Please specify new file...");
						System.out.print(">");
						line = br.readLine();
						resultushka = new File(line);
					}
				}

				String tagss = "";
				for (String tag : ids)
					tagss = String.format("%s\n\t\t%s", tagss, tag);
				logger.info(String
						.format("Starting generating of heml list\n\tBIB-file: %s\n\tTags:%s",
								bibushka.getAbsolutePath(), tagss));
				process();
				logger.info(String.format(
						"HTML generation complete. The result is in %s",
						resultushka.getAbsolutePath()));
			} else {
				throw new java.lang.IllegalArgumentException(
						"Wrong set of the arguments");
			}
			break;
		case PRINT:
			if (bibushka != null && this.ids == null
					&& this.resultushka == null && this.styleushka == null
					&& this.field == null && this.patternushka == null) {
				logger.debug(String.format("Print all entries"));

				grepBib();

			} else {
				throw new java.lang.IllegalArgumentException(
						"Wrong set of the arguments");
			}
			break;
		default:
			throw new Exception("It's a bug!");
		}
	}

	void grepBib() throws FileNotFoundException, IOException, ParseException {
		Map<Key, BibTeXEntry> entries;
		try (Reader reader = new FileReader(bibushka);) {
			BibTeXParser bibtexParser = new org.jbibtex.BibTeXParser();
			BibTeXDatabase database = bibtexParser.parse(reader);
			entries = database.getEntries();
		}
		if (patternushka == null) {
			logger.debug("Print all entries");
			for (Key key : entries.keySet()) {
				printBibEntry(key, entries.get(key));
			}
		} else {
			Pattern pattern = Pattern.compile(patternushka);
			if (field == null || field.equals("!tag")) {
				for (Key key : entries.keySet()) {
					if (pattern.matcher(key.toString()).matches())
						printBibEntry(key, entries.get(key));
				}
			} else {
				Key fieldK = new Key(field);
				for (Key key : entries.keySet()) {
					if (pattern.matcher(
							entries.get(key).getField(fieldK).toUserString())
							.matches())
						printBibEntry(key, entries.get(key));
				}
			}
		}
	}

	void printIds() throws FileNotFoundException, IOException, ParseException {
		Map<Key, BibTeXEntry> entries;
		try (Reader reader = new FileReader(bibushka);) {
			BibTeXParser bibtexParser = new org.jbibtex.BibTeXParser();
			BibTeXDatabase database = bibtexParser.parse(reader);
			entries = database.getEntries();
		}
		System.out.println("\tIDs:");
		int i = 1;
		for (Key key : entries.keySet())
			System.out
					.println(String.format("\t\t%d. %s", i++, key.toString()));

	}

	void printBibEntry(Key key, BibTeXEntry entry) {
		// System.out.println();
		Map<Key, Value> etr = entry.getFields();
		System.out.println(String.format("\tKey: %s", key.toString()));
		for (Key k : etr.keySet()) {
			System.out.println(String.format("\t\t%10s\t=\t%s", k.toString(),
					etr.get(k).toUserString()));
		}
		System.out.println("");
	}

	void process() throws FileNotFoundException, IOException, ParseException {
		logger.debug("HTML will be genrarated");
		String style = readStyleToString(styleushka);
		String outputFormat = "html";
		String res = Styler.process(bibushka, style, outputFormat, getSelectedKeys());
		logger.debug("HTML was generated");
		try (FileOutputStream fos = new FileOutputStream(resultushka)) {
			fos.write(res.getBytes());
			fos.close();
		}
		logger.debug("HTML saved");
	}

	String readStyleToString(File file) throws FileNotFoundException,
			IOException {
		String retval = null;
		try (FileInputStream fis = new FileInputStream(file)) {
			byte[] data = new byte[(int) file.length()];
			fis.read(data);
			fis.close();
			retval = new String(data);
		}
		return retval;
	}

	public final ArrayList<Key> getSelectedKeys() {
		ArrayList<Key> selectedKeys = new ArrayList<Key>();
		for (String tag : ids)
			selectedKeys.add(new Key(tag));
		return selectedKeys;
	}
}