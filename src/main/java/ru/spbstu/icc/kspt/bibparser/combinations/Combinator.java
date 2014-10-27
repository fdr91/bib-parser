package ru.spbstu.icc.kspt.bibparser.combinations;

import org.jbibtex.*;
import ru.spbstu.icc.kspt.bibparser.style.Style;

public interface Combinator {
	public Combination combine(BibTeXEntry entry, Style style);
}
