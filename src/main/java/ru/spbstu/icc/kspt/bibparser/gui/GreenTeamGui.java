package ru.spbstu.icc.kspt.bibparser.gui;

import org.slf4j.*;
import org.jbibtex.Key;

import java.awt.EventQueue;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import java.awt.event.WindowEvent;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.util.ArrayList;
import java.util.LinkedList;
import java.util.List;

import javax.swing.JFrame;
import javax.swing.JPanel;
import javax.swing.border.EmptyBorder;
import javax.swing.JFileChooser;
import javax.swing.JMenuBar;
import javax.swing.JMenu;
import javax.swing.JMenuItem;
import javax.swing.JTable;
import javax.swing.JTextField;
import javax.swing.SwingConstants;
import javax.swing.JButton;
import javax.swing.ImageIcon;
import javax.swing.JScrollPane;

import org.jbibtex.ParseException;

import ru.spbstu.icc.kspt.bibparser.helpers.Properties;

public class GreenTeamGui extends JFrame implements ActionListener {

	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;
	
	private Properties properties;
	private JButton bibNextBtn;
	private JButton styleNextBtn;
	private JButton stylePrevBtn;
	BibSelectionFrame bibSelectionFrame;
	StyleSelectionFrame styleSelectionFrame;
	
	private final Logger logger=LoggerFactory.getLogger(GreenTeamGui.class);

	
	
	/**
	 * Launch the application.
	 */
	public static void main(String[] args) {
		EventQueue.invokeLater(new Runnable() {
			public void run() {
				try {
					
					GreenTeamGui gui = new GreenTeamGui();
					gui.styleSelectionFrame.setVisible(false);
					gui.bibSelectionFrame.setVisible(true);
					
				} catch (Exception e) {
					e.printStackTrace();
				}
			}
		});
	}
	
	/**
	 * Create the frame.
	 */
	public GreenTeamGui() {
		properties = new Properties();
		
		bibNextBtn = new JButton();
		bibSelectionFrame = new BibSelectionFrame(null, bibNextBtn, this, properties);
		
		styleNextBtn = new JButton();
		stylePrevBtn = new JButton();
		styleSelectionFrame = new StyleSelectionFrame(stylePrevBtn, styleNextBtn, this, properties);
		properties.setStyle(styleSelectionFrame.getStyleFile());
		
	}

	public void actionPerformed(ActionEvent e) {

		// Handle open button action.
		Object source = e.getSource();
		if(source == bibNextBtn){
			logger.debug("Selected keys...");
			properties.setSelected(bibSelectionFrame.getTableEntries());
			styleSelectionFrame.setVisible(true);
			bibSelectionFrame.setVisible(false);
		} else if(source == styleNextBtn){
			logger.debug("styleNextBtn pressed");			
		} else if(source == stylePrevBtn){
			logger.debug("stylePrevBtn pressed");
			bibSelectionFrame.setVisible(true);
			styleSelectionFrame.setVisible(false);
		}
	}
}
