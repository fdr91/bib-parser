package ru.spbstu.icc.kspt.bibparser.cli;

import java.io.File;
import java.io.FileNotFoundException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

enum Option {
	M, BIB, ST, OP, IDS, P
}

enum ModeOptions {
	INTERACTIVE, COMMAND
}

enum Operation {
	TO_HTML, SHOW_TAGS, GREP_BIB
}

public class CliMainClass {

	private final static Logger logger = LoggerFactory
			.getLogger(CliMainClass.class);

	// Args
	boolean mode = false; // true — interactive, false — cli
	File bibushka; // Bib-file
	File styleushka;// Style-file
	File resultushka;// were results will be
	String[] ids; // tags to get from bib
	Operation operation = Operation.TO_HTML;
	String grepPattern;

	public void run(String[] args) {
		logger.debug("Start");
		try {
			parseArgs(args);

			if (mode)
				runInteractive();
			else
				runCommand();

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
			FileNotFoundException {
		Option curr;
		String arg1 = null;
		try {
			for (int i = 0; i < args.length; i++) {
				arg1 = args[i];
				String arg = arg1.toUpperCase().substring(1);
				curr = Option.valueOf(arg);
				switch (curr) {
				case M:
					logger.debug(String.format("\"%s %s\" passed", args[i],
							args[i + 1]));
					i++;
					ModeOptions mo = ModeOptions.valueOf(args[i]);
					switch (mo) {
					case COMMAND:
						mode = false;
						break;
					case INTERACTIVE:
						mode = true;
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
					logger.debug(String.format("\"%s %s\" passed", args[i],
							args[i + 1]));
					i++;
					this.styleushka = new File(args[i]);
					if (!styleushka.exists())
						throw new java.io.FileNotFoundException(String.format(
								"File %s not found", styleushka));
					break;
				case OP:
					logger.debug(String.format("\"%s %s\" passed", args[i],
							args[i + 1]));
					i++;
					operation = Operation.valueOf(args[i]);
					break;
				case IDS:
					logger.debug(String.format("\"%s %s\" passed", args[i],
							args[i + 1]));
					i++;
					ids = args[i].split(",");
					break;
				case P:
					logger.debug(String.format("\"%s %s\" passed", args[i],
							args[i + 1]));
					i++;
					grepPattern = args[i];
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
		switch (operation) {
		case GREP_BIB:
			break;
		case SHOW_TAGS:
			break;
		case TO_HTML:
			break;
		default:
			throw new Exception("It's a bug!");
		}
	}

	void runInteractive() {
		logger.debug("Run interactive mode");
	}
}