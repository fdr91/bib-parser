package ru.spbstu.icc.kspt.bibparser.gui;

import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;

import javax.swing.ImageIcon;
import javax.swing.JButton;
import javax.swing.JComboBox;
import javax.swing.JFileChooser;
import javax.swing.JPanel;
import javax.swing.JTextField;
import javax.swing.JTextPane;
import javax.swing.SwingConstants;
import javax.swing.border.EmptyBorder;

import org.jbibtex.ParseException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import ru.spbstu.icc.kspt.bibparser.helpers.Properties;
import ru.spbstu.icc.kspt.bibparser.style.Styler;

public class StyleSelectionFrame extends MultyWindowFrame implements ActionListener {
	
	/**
	 * Style selection frame is the 3rd and currently final stage of the program.
	 * Functions currently implemented: read a style file and style the selected books.
	 * 
	 * TODO Add styling process state symbolics / progress bar
	 * TODO make the process more usable: add STYLE button, instead of styling on file choice
	 * TODO Add recent style paths and files
	 * TODO Export to txt, html, (LaTEX?)
	 * 
	 */
	private final Logger logger=LoggerFactory.getLogger(StyleSelectionFrame.class);
	
	private static final long serialVersionUID = 4L;
	private JPanel styleSelectionPane;
	private JTextField styleFileSelected; // shows path to the currently selected style file
	private JButton btnOpenAStylefile;
	private String[] output_format_list = {"html", "text", "rtf", "foo", "asciidoc"};
	private JComboBox outputFormatList;
	private JFileChooser fc; 
	private File styleFile; 
	private String style; 
	private String chosen_output_format = "html";
	private Properties properties;
	private JTextPane  textPane;
	private String styled;
	
	
	public StyleSelectionFrame(final JButton prev, final JButton next, ActionListener listener, Properties pr) {
		super(prev, next);
		logger.debug("StyleSelectionFrame constructor invocation");
		bibSelectionPaneInitialisation(listener);
		properties = pr;
	}
	
	private void bibSelectionPaneInitialisation(ActionListener listener){
		styleSelectionPane = new JPanel();
		styleSelectionPane.setBorder(new EmptyBorder(5, 5, 5, 5));
		setContentPane(styleSelectionPane);
		styleSelectionPane.setLayout(null);

		styleFileSelected = new JTextField();
		styleFileSelected.setEditable(true);
		styleFileSelected.setHorizontalAlignment(SwingConstants.LEFT);
		styleFileSelected.setText("Open a style...");
		styleFileSelected.setBounds(10, 11, 327, 20);
		styleSelectionPane.add(styleFileSelected);
		styleFileSelected.setColumns(10);

		btnOpenAStylefile = new JButton("Open a style file");
		btnOpenAStylefile.setIcon(new ImageIcon(StyleSelectionFrame.class
				.getResource("/Open16.gif")));
		btnOpenAStylefile.setBounds(347, 10, 148, 23);
		btnOpenAStylefile.addActionListener(this);
		styleSelectionPane.add(btnOpenAStylefile);
		
		nextFrameButton.setText("Save to file");
		btnOpenAStylefile.setIcon(new ImageIcon(StyleSelectionFrame.class
				.getResource("/Save16.gif")));
		nextFrameButton.setBounds(406, 310, 89, 23);
		nextFrameButton.addActionListener(this);
		nextFrameButton.setEnabled(false);
		styleSelectionPane.add(nextFrameButton);
		
		previousFrameButton.setText("<- Back");
		previousFrameButton.setBounds(10, 310, 89, 23);
		previousFrameButton.addActionListener(listener);
		styleSelectionPane.add(previousFrameButton);
	
		textPane = new JTextPane();
		textPane.setBounds(10, 42, 600, 400);
		textPane.setContentType("text/html");
		styleSelectionPane.add(textPane);
		
		fc = new JFileChooser();
		 
		outputFormatList = new JComboBox(output_format_list);
		outputFormatList.setBounds(20, 50, 800, 700);
		outputFormatList.setSelectedIndex(0);
		outputFormatList.addActionListener(listener);
		styleSelectionPane.add(outputFormatList);
	}
	
	public File getStyleFile(){
		return styleFile;
	}
	
	@Override
	public void actionPerformed(ActionEvent e) {
		Object source = e.getSource();
		// 
		if (source == btnOpenAStylefile) {
			logger.debug("btnOpenAStylefile event");
			int returnVal = fc.showOpenDialog(StyleSelectionFrame.this);
			if (returnVal == JFileChooser.APPROVE_OPTION) {
				styleFile = fc.getSelectedFile();
				this.styleFileSelected.setText(styleFile.getAbsolutePath());
				//properties.setStyle(styleFile);
				nextFrameButton.setEnabled(true);
				style=readStyleFromString(styleFile);
				//chosen_output_format = "text";
				try {
					styled=Styler.process(properties.getBib(), style, chosen_output_format, properties.getSelected());
				} catch (IOException | ParseException e1) {
					// TODO Auto-generated catch block
					styled = "Cant process the data";
					e1.printStackTrace();
				}
				textPane.setText(styled);
			}
		} 
		if (source == nextFrameButton) {
			logger.debug("nextFrameButton event");
			int returnVal = fc.showSaveDialog(StyleSelectionFrame.this);
			if (returnVal == JFileChooser.APPROVE_OPTION) {
				File file = fc.getSelectedFile();
				try (FileOutputStream fos = new FileOutputStream(file)){
					fos.write(styled.getBytes());
					fos.close();
				} catch (FileNotFoundException e1) {
					// TODO Auto-generated catch block
					e1.printStackTrace();
				} catch (IOException e1) {
					// TODO Auto-generated catch block
					e1.printStackTrace();
				}
			}
		}
		
		if (source == outputFormatList) {
			logger.debug("outputFormatList event");
			JComboBox box = (JComboBox) e.getSource();
			String box_text = (String) box.getSelectedItem();
			chosen_output_format = box_text;
		}
	}
	
	String readStyleFromString(File file){
		String retval = null;
		try(FileInputStream fis = new FileInputStream(file)) {
		    byte[] data = new byte[(int)file.length()];
		    fis.read(data);
		    fis.close();
		    retval = new String(data);
		} catch(Exception e) {
			return null;
		}
		return retval;
	}
}
