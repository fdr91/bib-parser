
import java.awt.*;
import java.awt.event.*;
import java.io.File;
import javax.swing.*;
import javax.swing.event.*;

public class GUI extends JFrame {

	JTextField textParam;
	String [] param = {"�� ������","�� ��������","�� ����", "�� �������"};
		
	public GUI(String str){
		super(str);
		setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
		setResizable(false);
	   
		//������ ������ 
		Dimension sSize = Toolkit.getDefaultToolkit ().getScreenSize ();
		int vert = sSize.height;
		int hor  = sSize.width;
		vert = (vert/3)-200;
		hor = (hor/3)-165;
		
		//�����
		Font font = new Font("Verdana", Font.PLAIN, 12);
		final JTabbedPane tabbedPane = new JTabbedPane();
		tabbedPane.setFont(font);
		
		//�������� �������
		JPanel tab_panel1 = new JPanel();
		JPanel tab_panel2 = new JPanel();
		JPanel tab_panel3 = new JPanel();
		
		//��������� ���������� ����������
		tab_panel1.setLayout(new GridLayout(1,3));
		tab_panel2.setLayout(new GridLayout(1,3));
		tab_panel3.setLayout(new GridLayout(1,3));
		
		//���������� �������
		tabbedPane.addTab("��������� �������", tab_panel1);
		tabbedPane.addTab("����� ����������", tab_panel2);
		tabbedPane.addTab("����� �����", tab_panel3);
			
		//������� 1 **********************************************************************************************
		
		//���������
		JPanel panel5 = new JPanel();
		panel5.setLayout(new FlowLayout(FlowLayout.LEFT, 30,20));
		
		//����� "���������"
		JLabel label9 = new JLabel("���������");
		label9.setPreferredSize(new Dimension(400,23));
		panel5.add(label9);
		
		//����� "��������� ��������� �������"
		JLabel label10 = new JLabel("��������� ��������� �������");
		label10.setPreferredSize(new Dimension(350,23));
		panel5.add(label10);
		
		//��������� ������� "���������"
		JTextArea prosmotr = new JTextArea(8,5);
		JScrollPane prosmotrscroll=new JScrollPane(prosmotr);
		prosmotrscroll.setPreferredSize(new Dimension(400,450));
		panel5.add(prosmotrscroll);
		
		//��������� ������� "��������� ��������� �������"
		JTextArea proekt = new JTextArea(8,5);
		JScrollPane proektscroll=new JScrollPane(proekt);
		proektscroll.setPreferredSize(new Dimension(400,450));
		panel5.add(proektscroll);
		
		//�����-������
		JLabel otstup = new JLabel();
		otstup.setPreferredSize(new Dimension(635,25));
		panel5.add(otstup);
		
		//������ "������� ����� ������"
		JButton newProject = new JButton("������� ����� ������");
		panel5.add(newProject);
		newProject.addActionListener(new ActionListener(){
			public void actionPerformed(ActionEvent e) {
				tabbedPane.setSelectedIndex(1);				
			}
			
		});
		
		tab_panel1.add(panel5);
	
		// ������� 2**********************************************************************************************
		
		// ���� 1
		
		//���������
		JPanel panel1 = new JPanel();
		panel1.setLayout(new FlowLayout(FlowLayout.LEFT, 10,10));
		
		//����� "���� � bib-�����"
		JLabel label1 = new JLabel("���� � bib-�����");
		label1.setPreferredSize(new Dimension(200,25));
		panel1.add(label1);
		
		//��������� ���� "������� ����..."
		JTextField textPath = new JTextField("������� ����...");
		textPath.setPreferredSize(new Dimension(800,25));
		panel1.add(textPath);
		textPath.addMouseListener(new MouseAdapter(){
			public void mouseClicked(MouseEvent e) {
				textPath.setText("");
			}
		});	
		
		//������ ������
		JButton bibSearch = new JButton("...");
		panel1.add(bibSearch);
		bibSearch.addActionListener(new ActionListener() {
            public void actionPerformed(ActionEvent e) {
            	  JFileChooser fileopen = new JFileChooser();             
            	int ret = fileopen.showDialog(null, "������� ����");
            	if (ret == JFileChooser.APPROVE_OPTION) {
            	    File file = fileopen.getSelectedFile();
            	     /*
            	     * �������� bib-�����.
            	     */
            	    }
            	}
            });
		
		
		//����� "�����"
		JLabel label2 = new JLabel("�����");
		label2.setPreferredSize(new Dimension(800,25));
		panel1.add(label2);
		
		//��������� ������
		JComboBox paramSearch = new JComboBox(param);
		paramSearch.setPreferredSize(new Dimension(850,25));
		panel1.add(paramSearch);
		paramSearch.addItemListener(new ItemListener(){
			public void itemStateChanged(ItemEvent e) {
				if (paramSearch.getSelectedIndex()==0)
					textParam.setText("������� ������� "+ paramSearch.getSelectedIndex());
				else if (paramSearch.getSelectedIndex()==1)
					textParam.setText("������� ������� "+ paramSearch.getSelectedIndex());
				else if (paramSearch.getSelectedIndex()==2)
					textParam.setText("������� ������� "+ paramSearch.getSelectedIndex());
				else if (paramSearch.getSelectedIndex()==3)
					textParam.setText("������� ������� "+ paramSearch.getSelectedIndex());
			}
			
		});
		
		//��������� ���� "������� ��������..."
		textParam = new JTextField("������� ��������...");
		textParam.setPreferredSize(new Dimension(770,25));
		panel1.add(textParam);
		textParam.addMouseListener(new MouseAdapter(){
			public void mouseClicked(MouseEvent e) {
				textParam.setText("");
			}
		});	
		
		//������ "�����"
		JButton search = new JButton("�����");
		panel1.add(search);
		
		// ���� 2	

		//����� "bib-����"
		JLabel label3 = new JLabel("bib-����");
		label3.setPreferredSize(new Dimension(470,23));
		panel1.add(label3);
		
		//����� "��������� ����������"
		JLabel label4 = new JLabel("��������� ����������");
		label4.setPreferredSize(new Dimension(300,23));
		panel1.add(label4);
				
		//��������� ������� "bib-����"
		JTextArea bibText = new JTextArea(8,5);
		JScrollPane bibscroll=new JScrollPane(bibText);
		bibscroll.setPreferredSize(new Dimension(375,300));
		panel1.add(bibscroll);
	   
		//��������� ������
		JPanel panel33 = new JPanel();
		panel33.setLayout(new BorderLayout(25,25));
		JButton add = new JButton(">>>");
		JButton del = new JButton("<<<");
		JButton clear = new JButton("��������");
		panel33.add(add, BorderLayout.NORTH);
		panel33.add(del, BorderLayout.CENTER);
		panel33.add(clear, BorderLayout.SOUTH);
		panel1.add(panel33);
		
		//��������� ������� "��������� ����������"
		JTextArea liter = new JTextArea(8,5);
		JScrollPane literscroll=new JScrollPane(liter);
		literscroll.setPreferredSize(new Dimension(375,300));
		panel1.add(literscroll);
		
		//�����-������
		JLabel label5 = new JLabel();
		label5.setPreferredSize(new Dimension(770,25));
		panel1.add(label5);
		
		//������ "�����"
		JButton next = new JButton("�����");
		panel1.add(next);
		next.addActionListener(new ActionListener(){
			public void actionPerformed(ActionEvent e) {
				tabbedPane.setSelectedIndex(2);				
			}
			
		});
		
		tab_panel2.add(panel1);
		
		//������� 3**********************************************************************************************
		
		//���������
		JPanel panel2 = new JPanel();
		panel2.setLayout(new FlowLayout(FlowLayout.LEFT, 30,20));
		
		//����� "������ ����������"
		JLabel label6 = new JLabel("������ ����������");
		label6.setPreferredSize(new Dimension(400,23));
		
		//����� "����� ����� ����������"
		panel2.add(label6);
		JLabel label7 = new JLabel("����� ����� ����������");
		label7.setPreferredSize(new Dimension(350,23));
		panel2.add(label7);
		
		// ��������� ������� "������ ����������"
		JTextArea liter2 = new JTextArea(8,5);
		//liter2.setPreferredSize(new Dimension(400,450));
		JScrollPane liter2scroll=new JScrollPane(liter2);
		liter2scroll.setPreferredSize(new Dimension(400,450));
		panel2.add(liter2scroll);
		
		//// ��������� ������� "����� ����� ����������"
		JTextArea stil = new JTextArea(8,5);
		//stil.setPreferredSize(new Dimension(400,450));
		JScrollPane stilscroll=new JScrollPane(stil);
		stilscroll.setPreferredSize(new Dimension(400,450));
		panel2.add(stilscroll);
		
		//�����-������
		JLabel label8 = new JLabel();
		label8.setPreferredSize(new Dimension(400,25));
		panel2.add(label8);
		
		//������ "��������"
		JButton preview = new JButton("��������");
		panel2.add(preview);
		
		//������ "�������� ������ �����"
		JButton addStyle = new JButton("�������� ������ �����");
		panel2.add(addStyle);
		
		//������ "��"
		JButton OK = new JButton("��");
		panel2.add(OK);
		
		tab_panel3.add(panel2);
	
		//����
		JMenuBar menu = new JMenuBar();
		JMenu file = new JMenu("����");
		JMenuItem fileSelectBib = new JMenuItem("������� bib-����", new ImageIcon("/open-icon.png"));
	   // fileSelectBib.setIcon(new ImageIcon("images/open-icon.png"));
		
		JMenuItem fileSearch = new JMenuItem("�����");
		JMenuItem save = new JMenuItem("���������");
		JMenuItem saveAs = new JMenuItem("��������� ���");
		JMenuItem close = new JMenuItem("�����");
		file.add(fileSelectBib);
		setJMenuBar(menu);
		menu.add(file);
		file.add(fileSearch);
		file.addSeparator();
		file.add(save);
		file.add(saveAs);
		file.addSeparator();
		file.add(close);
		JMenu help = new JMenu("������");
		JMenuItem spravka = new JMenuItem("�������");
		JMenuItem prog = new JMenuItem("� ���������");
		help.add(spravka);
		help.addSeparator();
		help.add(prog);
		menu.add(help);
		
		Container c = getContentPane();
		c.setLayout(new GridLayout());
		
		c.add(tabbedPane);
		setSize(900, 660);
		setLocation(hor, vert);
		setVisible(true);
	}
	
	public static void main(String[] args) {
        javax.swing.SwingUtilities.invokeLater(new Runnable() {
            public void run() {
                JFrame.setDefaultLookAndFeelDecorated(true);
                new GUI("������������ ������ ����������");
            }
        });
    }

}