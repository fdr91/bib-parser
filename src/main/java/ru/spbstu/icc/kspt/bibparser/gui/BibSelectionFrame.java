package ru.spbstu.icc.kspt.bibparser.gui;

import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.util.ArrayList;

import javax.swing.ImageIcon;
import javax.swing.JButton;
import javax.swing.JFileChooser;
import javax.swing.JPanel;
import javax.swing.JScrollPane;
import javax.swing.JTable;
import javax.swing.JTextField;
import javax.swing.SwingConstants;
import javax.swing.border.EmptyBorder;

import org.jbibtex.Key;
import org.jbibtex.ParseException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import ru.spbstu.icc.kspt.bibparser.helpers.BibTable;
import ru.spbstu.icc.kspt.bibparser.helpers.Constants;
import ru.spbstu.icc.kspt.bibparser.helpers.Properties;

public class BibSelectionFrame extends MultyWindowFrame implements ActionListener {
	
	/**
	 * 
	 */
	private final Logger logger=LoggerFactory.getLogger(BibSelectionFrame.class);
	
	private static final long serialVersionUID = 3L;
	private JPanel bibSelectionPane;
	private JTextField txtBibIsNot;
	private JButton btnOpenABibfile;
	private JButton mainNextBtn;
	private JFileChooser fc;
	
	private JScrollPane scrollPane;
	private BibTable bibTable;
	private JTable table;
	private Properties properties;
	
	
	public BibSelectionFrame(final JButton prev, final JButton next, ActionListener listener, Properties properties) {
		super(prev, next);
		logger.debug("BibSelectionFrame constructor invocation");
		mainNextBtn = next;
		bibSelectionPaneInitialisation(listener);
		this.properties = properties;
	}
	
	private void bibSelectionPaneInitialisation(ActionListener listener){
		bibSelectionPane = new JPanel();
		bibSelectionPane.setBorder(new EmptyBorder(5, 5, 5, 5));
		setContentPane(bibSelectionPane);
		bibSelectionPane.setLayout(null);

		txtBibIsNot = new JTextField();
		txtBibIsNot.setEditable(false);
		txtBibIsNot.setHorizontalAlignment(SwingConstants.LEFT);
		txtBibIsNot.setText("Open a bib...");
		txtBibIsNot.setBounds(10, 11, 327, 20);
		bibSelectionPane.add(txtBibIsNot);
		txtBibIsNot.setColumns(10);

		btnOpenABibfile = new JButton("Open a bib. file");
		btnOpenABibfile.setIcon(new ImageIcon(BibSelectionFrame.class
				.getResource("/Open16.gif")));
		btnOpenABibfile.setBounds(347, 10, 148, 23);
		btnOpenABibfile.addActionListener(this);
		bibSelectionPane.add(btnOpenABibfile);
				
		scrollPane = new JScrollPane(/*table*/);
		scrollPane.setBounds(10, 42, 485, 257);
		bibSelectionPane.add(scrollPane);
		
		mainNextBtn.setText("Next ->");
		mainNextBtn.setBounds(406, 310, 89, 23);
		mainNextBtn.addActionListener(listener);
		mainNextBtn.setEnabled(false);
		bibSelectionPane.add(mainNextBtn);
	
		fc = new JFileChooser();
	}
	
	public final ArrayList<Key> getTableEntries(){
		int[] indexes=table.getSelectedRows();
		ArrayList<Key> selectedKeys = new ArrayList<Key>();
		for(int i : indexes)
		{
			String tag=(String)table.getModel().getValueAt(i, Constants.TAG_INDEX);
			selectedKeys.add(new Key(tag));
			logger.debug(tag);
		}
		return selectedKeys;
	}
	
	
	
	@Override
	public void actionPerformed(ActionEvent e) {
		Object source = e.getSource();
		if (source == btnOpenABibfile) {
			logger.debug("btnOpenABibfile event");
			int returnVal = fc.showOpenDialog(BibSelectionFrame.this);
			if (returnVal == JFileChooser.APPROVE_OPTION) {
				properties.setBib(fc.getSelectedFile());
				txtBibIsNot.setText(properties.getBib().getAbsolutePath());
				try {
					bibTable = new BibTable(properties.getBib());
				} catch (FileNotFoundException e1) {
					// TODO Auto-generated catch block
					e1.printStackTrace();
				} catch (IOException e1) {
					// TODO Auto-generated catch block
					e1.printStackTrace();
				} catch (ParseException e1) {
					// TODO Auto-generated catch block
					e1.printStackTrace();
				}
				table = bibTable.getTable();
				scrollPane.setViewportView(table);
				table.setFillsViewportHeight(true);
				mainNextBtn.setEnabled(true);
			}
		} 
	}
	
}
